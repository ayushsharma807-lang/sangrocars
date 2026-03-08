import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { requireDealer } from "@/lib/dealerAuth";
import { supabaseServer } from "@/lib/supabase";
import { DEFAULT_LISTING_SOURCE } from "@/lib/listingSource";

const HEADER_MAP: Record<string, string> = {
  make: "make",
  model: "model",
  variant: "variant",
  year: "year",
  price: "price",
  km: "km",
  kilometers: "km",
  fuel: "fuel",
  transmission: "transmission",
  location: "location",
  city: "location",
  status: "status",
  type: "type",
  description: "description",
  photo_urls: "photo_urls",
  photos: "photo_urls",
  images: "photo_urls",
};

const normalizeHeader = (header: string) =>
  header.toLowerCase().replace(/\s+/g, "_");

const parseNumber = (value?: string) => {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const parsePhotoUrls = (value?: string | null) => {
  if (!value) return [] as string[];
  return value
    .split(/[\n,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const chunk = <T,>(items: T[], size: number) => {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
};

export async function POST(req: Request) {
  const auth = await requireDealer();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/dealer-admin/login", req.url));
  }

  const form = await req.formData();
  const file = form.get("file");
  const defaultStatus = String(form.get("status") ?? "available").trim();
  const defaultType = String(form.get("type") ?? "used").trim();
  const returnPath = String(form.get("return") ?? "/dealer-admin/listings");

  if (!file || !(file instanceof File)) {
    return NextResponse.redirect(
      new URL(`${returnPath}?imported=0&skipped=0&failed=1`, req.url)
    );
  }

  const text = await file.text();
  let rows: Record<string, string>[] = [];
  try {
    rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];
  } catch {
    return NextResponse.redirect(
      new URL(`${returnPath}?imported=0&skipped=0&failed=1`, req.url)
    );
  }

  const records: Record<string, unknown>[] = [];
  let skipped = 0;

  for (const row of rows) {
    const record: Record<string, unknown> = {};
    for (const [rawHeader, rawValue] of Object.entries(row)) {
      const header = normalizeHeader(rawHeader);
      const key = HEADER_MAP[header];
      if (!key) continue;
      const value = String(rawValue ?? "").trim();
      if (!value) continue;
      record[key] = value;
    }

    const make = String(record.make ?? "").trim();
    const model = String(record.model ?? "").trim();
    if (!make || !model) {
      skipped += 1;
      continue;
    }

    const typeValue = record.type ?? defaultType ?? "used";
    const statusValue = record.status ?? defaultStatus ?? "available";
    const payload = {
      source: DEFAULT_LISTING_SOURCE,
      dealer_id: auth.dealer.id,
      type: String(typeValue).trim() || "used",
      status: String(statusValue).trim().toLowerCase() === "sold" ? "sold" : "pending",
      make,
      model,
      variant: String(record.variant ?? "").trim() || null,
      year: parseNumber(String(record.year ?? "")),
      price: parseNumber(String(record.price ?? "")),
      km: parseNumber(String(record.km ?? "")),
      fuel: String(record.fuel ?? "").trim() || null,
      transmission: String(record.transmission ?? "").trim() || null,
      location: String(record.location ?? "").trim() || null,
      description: String(record.description ?? "").trim() || null,
      photo_urls: parsePhotoUrls(String(record.photo_urls ?? "")),
    };

    records.push(payload);
  }

  if (records.length === 0) {
    return NextResponse.redirect(
      new URL(
        `${returnPath}?imported=0&skipped=${skipped}&failed=0`,
        req.url
      )
    );
  }

  const sb = supabaseServer();
  let imported = 0;
  let failed = 0;

  for (const batch of chunk(records, 200)) {
    const { data, error } = await sb
      .from("listings")
      .insert(batch)
      .select("id");

    if (error) {
      failed += batch.length;
      continue;
    }

    imported += data?.length ?? batch.length;
  }

  return NextResponse.redirect(
    new URL(
      `${returnPath}?imported=${imported}&skipped=${skipped}&failed=${failed}`,
      req.url
    )
  );
}
