import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { logLeadAudit } from "@/lib/leadAudit";

const HEADER_MAP: Record<string, string> = {
  name: "name",
  full_name: "name",
  fullname: "name",
  phone: "phone",
  mobile: "phone",
  email: "email",
  listing_id: "listing_id",
  listingid: "listing_id",
  listing_title: "listing_title",
  listingtitle: "listing_title",
  dealer_id: "dealer_id",
  dealerid: "dealer_id",
  status: "status",
  source: "source",
  message: "message",
  notes: "notes",
  assigned_to: "assigned_to",
  assignedto: "assigned_to",
};

const normalizeHeader = (header: string) =>
  header.toLowerCase().replace(/\s+/g, "_");

const normalizePhone = (value?: string) => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};

const chunk = <T,>(items: T[], size: number) => {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
};

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const form = await req.formData();
  const file = form.get("file");
  const defaultStatus = String(form.get("status") ?? "new").trim();
  const defaultSource = String(form.get("source") ?? "import").trim();
  const defaultAssigned = String(form.get("assigned_to") ?? "").trim();
  const returnPath = String(form.get("return") ?? "/admin/leads");

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

    if (!record.name && row["name"]) {
      record.name = String(row["name"]).trim();
    }

    if (record.phone) {
      record.phone = normalizePhone(String(record.phone));
    } else if (row["phone"]) {
      record.phone = normalizePhone(String(row["phone"]));
    }

    if (!record.name || !record.phone) {
      skipped += 1;
      continue;
    }

    if (!record.status && defaultStatus) {
      record.status = defaultStatus;
    }

    if (!record.source && defaultSource) {
      record.source = defaultSource;
    }

    if (!record.assigned_to && defaultAssigned) {
      record.assigned_to = defaultAssigned;
    }

    records.push(record);
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
      .from("leads")
      .insert(batch)
      .select("id");

    if (error) {
      failed += batch.length;
      continue;
    }

    imported += data?.length ?? batch.length;
    if (data) {
      for (const row of data) {
        await logLeadAudit({
          lead_id: String(row.id),
          action: "import",
          changes: { source: defaultSource },
          actor_email: auth.user?.email ?? null,
          actor_id: auth.user?.id ?? null,
        });
      }
    }
  }

  return NextResponse.redirect(
    new URL(
      `${returnPath}?imported=${imported}&skipped=${skipped}&failed=${failed}`,
      req.url
    )
  );
}
