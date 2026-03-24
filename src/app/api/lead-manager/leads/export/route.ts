import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/lib/leadManagerTypes";

const ensureAuthed = async () => {
  const store = await cookies();
  return store.get("lead_manager_admin")?.value === "1";
};

const sanitize = (value: string | null | undefined) => (value ?? "").trim();

const escapeCsv = (value: string | null | undefined) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

export async function GET(req: Request) {
  if (!(await ensureAuthed())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const search = sanitize(url.searchParams.get("search"));
  const source = sanitize(url.searchParams.get("source"));
  const status = sanitize(url.searchParams.get("status"));

  const sb = supabaseServer();
  let query = sb
    .from("lead_manager_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,phone.ilike.%${search}%,interested_car.ilike.%${search}%`
    );
  }

  if (source && LEAD_SOURCES.includes(source as never)) {
    query = query.eq("source", source);
  }

  if (status && LEAD_STATUSES.includes(status as never)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Could not export leads." },
      { status: 500 }
    );
  }

  const headers = [
    "id",
    "full_name",
    "phone",
    "city",
    "budget",
    "interested_car",
    "source",
    "cash_or_finance",
    "status",
    "notes",
    "next_follow_up_date",
    "assigned_to",
    "created_at",
    "updated_at",
  ];

  const rows = (data ?? []).map((lead) =>
    headers.map((header) => escapeCsv(lead[header]))
  );
  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=lead-manager-export.csv",
    },
  });
}
