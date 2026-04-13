import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

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
    | { status?: string; caption?: string }
    | null;

  if (!payload?.status) {
    return NextResponse.json({ ok: false, error: "Missing status." }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = {
    instagram_post_status: payload.status,
    instagram_caption: payload.caption ?? null,
  };

  if (payload.status === "posted") {
    updatePayload.instagram_posted_at = new Date().toISOString();
  }

  const sb = supabaseServer();
  const { error } = await sb.from("listings").update(updatePayload).eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message || "Could not update Instagram status." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
