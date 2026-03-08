import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

const parseNumber = (value: FormDataEntryValue | null) => {
  if (!value) return null;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? Math.round(num) : null;
};

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/admin/login?error=unauthorized", req.url));
  }

  const form = await req.formData();
  const id = params.id;
  const returnPath = String(form.get("return") ?? "/admin/listings");
  const contactOnly = String(form.get("contact_for_price") ?? "") === "on";
  const price = contactOnly ? null : parseNumber(form.get("price"));

  const sb = supabaseServer();
  const { error } = await sb
    .from("listings")
    .update({ status: "available", price })
    .eq("id", id);

  if (error) {
    const url = new URL(returnPath, req.url);
    url.searchParams.set("error", encodeURIComponent("Failed to approve listing."));
    return NextResponse.redirect(url);
  }

  const url = new URL(returnPath, req.url);
  url.searchParams.set("action", "listing_approved");
  return NextResponse.redirect(url);
}
