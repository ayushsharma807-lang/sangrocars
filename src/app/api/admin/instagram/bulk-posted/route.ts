import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/admin/login?error=unauthorized", req.url));
  }

  const form = await req.formData();
  const ids = form.getAll("ids").map((id) => String(id));
  const returnPath = String(form.get("return") ?? "/admin/listings");

  if (ids.length === 0) {
    return NextResponse.redirect(new URL(returnPath, req.url));
  }

  const sb = supabaseServer();
  await sb
    .from("listings")
    .update({
      instagram_post_status: "posted",
      instagram_posted_at: new Date().toISOString(),
    })
    .in("id", ids);

  return NextResponse.redirect(new URL(returnPath, req.url));
}
