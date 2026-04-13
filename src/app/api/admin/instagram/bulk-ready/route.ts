import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { buildInstagramCaption } from "@/lib/instagramCaption";

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
  const { data } = await sb
    .from("listings")
    .select("id, make, model, variant, year, fuel, transmission, km, price")
    .in("id", ids);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sangrocars.in";

  for (const listing of data ?? []) {
    const listingUrl = `${siteUrl}/listing/${listing.id}`;
    const caption = buildInstagramCaption(listing, listingUrl);
    await sb
      .from("listings")
      .update({
        instagram_post_status: "ready",
        instagram_caption: caption,
      })
      .eq("id", listing.id);
  }

  return NextResponse.redirect(new URL(returnPath, req.url));
}
