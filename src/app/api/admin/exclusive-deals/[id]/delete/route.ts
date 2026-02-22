import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/admin/login?error=unauthorized", req.url));
  }

  const sb = supabaseServer();
  const { error } = await sb
    .from("exclusive_deals")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/admin/exclusive-deals?error=${encodeURIComponent(error.message)}`,
        req.url
      )
    );
  }

  return NextResponse.redirect(
    new URL("/admin/exclusive-deals?status=deleted", req.url)
  );
}
