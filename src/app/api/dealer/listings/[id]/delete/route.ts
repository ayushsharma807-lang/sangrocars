import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireDealer } from "@/lib/dealerAuth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireDealer();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/dealer-admin/login", req.url));
  }

  const sb = supabaseServer();
  const { data: listing } = await sb
    .from("listings")
    .select("id, dealer_id")
    .eq("id", id)
    .single();

  if (!listing || listing.dealer_id !== auth.dealer.id) {
    return NextResponse.redirect(new URL("/dealer-admin/listings", req.url));
  }

  await sb.from("listings").delete().eq("id", id);
  return NextResponse.redirect(new URL("/dealer-admin/listings", req.url));
}
