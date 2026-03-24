import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as XLSX from "xlsx";
import { supabaseServer } from "@/lib/supabase";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/lib/leadManagerTypes";

const ensureAuthed = async () => {
  const store = await cookies();
  return store.get("lead_manager_admin")?.value === "1";
};

const sanitize = (value: string | null | undefined) => (value ?? "").trim();

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

  const rows = (data ?? []).map((lead) => ({
    id: lead.id,
    full_name: lead.full_name,
    phone: lead.phone,
    city: lead.city,
    budget: lead.budget,
    interested_car: lead.interested_car,
    source: lead.source,
    cash_or_finance: lead.cash_or_finance,
    status: lead.status,
    notes: lead.notes,
    next_follow_up_date: lead.next_follow_up_date,
    assigned_to: lead.assigned_to,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=lead-manager-export.xlsx",
    },
  });
}
