import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireDealer } from "@/lib/dealerAuth";

const csvEscape = (value: unknown) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const buildCsv = (rows: Record<string, unknown>[], columns: string[]) => {
  const header = columns.join(",");
  const body = rows.map((row) =>
    columns.map((col) => csvEscape(row[col])).join(",")
  );
  return [header, ...body].join("\n");
};

const isMissingSchema = (message?: string | null) => {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return (
    lowered.includes("does not exist") ||
    lowered.includes("column") ||
    lowered.includes("could not find the table") ||
    lowered.includes("schema cache") ||
    lowered.includes("relation") ||
    lowered.includes("unknown")
  );
};

const ALLOWED_COLUMNS = [
  "id",
  "name",
  "phone",
  "email",
  "listing_id",
  "listing_title",
  "status",
  "source",
  "message",
  "notes",
  "created_at",
];

const DEFAULT_COLUMNS = [
  "name",
  "phone",
  "email",
  "listing_title",
  "status",
  "created_at",
];

export async function GET(req: Request) {
  const auth = await requireDealer();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/dealer-admin/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const requestedColumns = searchParams.getAll("columns");
  const selectedColumns = requestedColumns
    .map((value) => value.trim())
    .filter((value) => ALLOWED_COLUMNS.includes(value));
  const baseColumns = selectedColumns.length > 0 ? selectedColumns : DEFAULT_COLUMNS;

  const sb = supabaseServer();
  let leads: Record<string, unknown>[] = [];

  const byDealer = await sb
    .from("leads")
    .select("*")
    .eq("dealer_id", auth.dealer.id)
    .order("created_at", { ascending: false });

  if (!byDealer.error) {
    leads = byDealer.data ?? [];
  } else if (isMissingSchema(byDealer.error.message)) {
    const listings = await sb
      .from("listings")
      .select("id")
      .eq("dealer_id", auth.dealer.id);
    if (!listings.error && listings.data?.length) {
      const ids = listings.data.map((row) => row.id);
      const byListing = await sb
        .from("leads")
        .select("*")
        .in("listing_id", ids)
        .order("created_at", { ascending: false });
      leads = byListing.data ?? [];
    }
  } else {
    return NextResponse.json(
      { ok: false, error: byDealer.error.message },
      { status: 500 }
    );
  }

  const columns =
    leads.length > 0
      ? baseColumns.filter((col) => col in (leads[0] ?? {}))
      : baseColumns;

  const csv = buildCsv(leads, columns);
  const filename = `dealer-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
