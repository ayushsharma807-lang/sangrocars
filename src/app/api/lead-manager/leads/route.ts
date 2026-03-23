import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
    .limit(2000);

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
      { ok: false, error: error.message || "Could not load leads." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, leads: data ?? [] });
}

export async function POST(req: Request) {
  if (!(await ensureAuthed())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as
    | {
        fullName?: string;
        phone?: string;
        city?: string;
        budget?: string;
        interestedCar?: string;
        source?: string;
        cashOrFinance?: string;
        status?: string;
        notes?: string;
        nextFollowUpDate?: string;
        assignedTo?: string;
      }
    | null;

  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  const fullName = sanitize(payload.fullName);
  const phone = sanitize(payload.phone);

  if (!fullName || !phone) {
    return NextResponse.json(
      { ok: false, error: "Full name and phone are required." },
      { status: 400 }
    );
  }

  const insertPayload = {
    full_name: fullName,
    phone,
    city: sanitize(payload.city) || null,
    budget: sanitize(payload.budget) || null,
    interested_car: sanitize(payload.interestedCar) || null,
    source: sanitize(payload.source) || null,
    cash_or_finance: sanitize(payload.cashOrFinance) || null,
    status: sanitize(payload.status) || "new",
    notes: sanitize(payload.notes) || null,
    next_follow_up_date: payload.nextFollowUpDate || null,
    assigned_to: sanitize(payload.assignedTo) || null,
  };

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("lead_manager_leads")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data?.id) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Could not create lead." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
