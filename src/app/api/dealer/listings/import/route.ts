import { NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import { requireDealer } from "@/lib/dealerAuth";
import { supabaseServer } from "@/lib/supabase";
import { DEFAULT_LISTING_SOURCE } from "@/lib/listingSource";
import { notifyPendingBatch } from "@/lib/adminNotifications";
import { ensureListingPhotoBucket, LISTING_PHOTO_BUCKET } from "@/lib/listingPhotoBucket";
import { markListingPendingApproval } from "@/lib/listingApproval";

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
  image_key: "image_key",
  imagekey: "image_key",
  stock: "image_key",
  stock_id: "image_key",
  stockid: "image_key",
  stock_no: "image_key",
  stockno: "image_key",
  ref: "image_key",
  reference: "image_key",
  sku: "image_key",
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

const normalizeKey = (value?: string | null) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const sanitizeExt = (value?: string | null) => {
  if (!value) return "jpg";
  const cleaned = value.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return cleaned || "jpg";
};

const extFromEntryName = (value?: string | null) => {
  const ext = String(value ?? "").split(".").pop();
  return sanitizeExt(ext);
};

const mergePhotoUrls = (...groups: string[][]) =>
  Array.from(new Set(groups.flat().filter(Boolean)));

const uploadBufferPhoto = async (
  path: string,
  buffer: Buffer,
  contentType = "image/jpeg"
) => {
  const sb = supabaseServer();
  const { error } = await sb.storage
    .from(LISTING_PHOTO_BUCKET)
    .upload(path, buffer, {
      upsert: true,
      contentType,
    });

  if (error) {
    throw error;
  }

  const { data } = sb.storage.from(LISTING_PHOTO_BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
};

const extractZipImages = async (file: File | null) => {
  if (!file || file.size === 0) {
    return new Map<string, { buffer: Buffer; name: string; mimeType: string }[]>();
  }

  const zip = new AdmZip(Buffer.from(await file.arrayBuffer()));
  const byKey = new Map<string, { buffer: Buffer; name: string; mimeType: string }[]>();

  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    const name = entry.entryName.split("/").pop() ?? "";
    const lower = name.toLowerCase();
    if (!/\.(jpg|jpeg|png|webp)$/i.test(lower)) continue;

    const stem = name.replace(/\.[^.]+$/, "");
    const keyCandidate = normalizeKey(stem.replace(/(?:[-_ ]?(?:img|image|photo|pic))?[-_ ]?\d+$/i, ""));
    const buffer = entry.getData();
    const mimeType = lower.endsWith(".png")
      ? "image/png"
      : lower.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";

    if (!keyCandidate) continue;
    const list = byKey.get(keyCandidate) ?? [];
    list.push({ buffer, name, mimeType });
    byKey.set(keyCandidate, list);
  }

  return byKey;
};

const uploadMatchedZipPhotos = async (
  zipImages: Map<string, { buffer: Buffer; name: string; mimeType: string }[]>,
  imageKey: string,
  folder: string
) => {
  const normalized = normalizeKey(imageKey);
  if (!normalized) return [];

  const matches = zipImages.get(normalized) ?? [];
  const urls: string[] = [];

  for (let index = 0; index < matches.length && index < 8; index += 1) {
    const image = matches[index];
    const ext = extFromEntryName(image.name);
    const path = `${folder}/${normalized}-${index + 1}.${ext}`;
    const publicUrl = await uploadBufferPhoto(path, image.buffer, image.mimeType);
    if (publicUrl) urls.push(publicUrl);
  }

  return urls;
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
  const imagesZip = form.get("images_zip");
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
  let preprocessingFailed = 0;
  let zipImageMap = new Map<string, { buffer: Buffer; name: string; mimeType: string }[]>();

  await ensureListingPhotoBucket();
  if (imagesZip instanceof File && imagesZip.size > 0) {
    try {
      zipImageMap = await extractZipImages(imagesZip);
    } catch {
      return NextResponse.redirect(
        new URL(`${returnPath}?imported=0&skipped=0&failed=1`, req.url)
      );
    }
  }

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

    try {
      const typeValue = record.type ?? defaultType ?? "used";
      const statusValue = String(record.status ?? defaultStatus ?? "available")
        .trim()
        .toLowerCase();
      const shouldMarkPending = statusValue !== "sold";
      const imageKey =
        String(record.image_key ?? "").trim() ||
        [make, model, record.variant, record.year].filter(Boolean).join(" ");
      const zipPhotoUrls = imageKey
        ? await uploadMatchedZipPhotos(
            zipImageMap,
            imageKey,
            `dealer-import/${auth.dealer.id}/${Date.now()}`
          )
        : [];
      const descriptionText = String(record.description ?? "").trim() || null;
      const payload = {
        source: DEFAULT_LISTING_SOURCE,
        dealer_id: auth.dealer.id,
        type: String(typeValue).trim() || "used",
        status: "sold",
        make,
        model,
        variant: String(record.variant ?? "").trim() || null,
        year: parseNumber(String(record.year ?? "")),
        price: parseNumber(String(record.price ?? "")),
        km: parseNumber(String(record.km ?? "")),
        fuel: String(record.fuel ?? "").trim() || null,
        transmission: String(record.transmission ?? "").trim() || null,
        location: String(record.location ?? "").trim() || null,
        description: shouldMarkPending
          ? markListingPendingApproval(descriptionText)
          : descriptionText,
        photo_urls: mergePhotoUrls(
          parsePhotoUrls(String(record.photo_urls ?? "")),
          zipPhotoUrls
        ),
      };

      records.push(payload);
    } catch {
      preprocessingFailed += 1;
    }
  }

  if (records.length === 0) {
    return NextResponse.redirect(
      new URL(
        `${returnPath}?imported=0&skipped=${skipped}&failed=${preprocessingFailed}`,
        req.url
      )
    );
  }

  const sb = supabaseServer();
  let imported = 0;
  let failed = preprocessingFailed;

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

  await notifyPendingBatch({
    count: imported,
    source: "dealer_csv",
  });

  return NextResponse.redirect(
    new URL(
      `${returnPath}?imported=${imported}&skipped=${skipped}&failed=${failed}`,
      req.url
    )
  );
}
