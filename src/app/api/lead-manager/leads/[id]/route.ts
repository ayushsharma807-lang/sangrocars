import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";

const ensureAuthed = async () => {
  const store = await cookies();
  return store.get("lead_manager_admin")?.value === "1";
};

const sanitize = (value: string | null | undefined) => (value ?? "").trim();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await ensureAuthed())) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const payload = (await req.json().catch(() => null)) as
    | {
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

  const updatePayload = {
    status: sanitize(payload.status) || null,
    notes: sanitize(payload.notes) || null,
    next_follow_up_date: payload.nextFollowUpDate || null,
    assigned_to: sanitize(payload.assignedTo) || null,
  };

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("lead_manager_leads")
    .update(updatePayload)
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data?.id) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Could not update lead." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
