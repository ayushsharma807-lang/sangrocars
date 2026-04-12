import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const payload = (await req.json().catch(() => null)) as
    | { status?: string; notes?: string }
    | null;

  if (!payload) {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  const sb = supabaseServer();
  const { error } = await sb
    .from("leads")
    .update({
      status: payload.status ?? null,
      notes: payload.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Could not update lead." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
