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

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/admin/login?error=unauthorized", req.url));
  }

  const form = await req.formData();
  const ids = form.getAll("ids").map((value) => String(value)).filter(Boolean);
  const returnPath = String(form.get("return") ?? "/admin/listings");
  const contactOnly = String(form.get("contact_for_price") ?? "") === "on";
  const price = contactOnly ? null : parseNumber(form.get("price"));

  if (!ids.length) {
    const url = new URL(returnPath, req.url);
    url.searchParams.set("error", encodeURIComponent("Select at least one listing."));
    return NextResponse.redirect(url);
  }

  const sb = supabaseServer();
  const { error } = await sb
    .from("listings")
    .update({ status: "available", price })
    .in("id", ids)
    .eq("status", "pending");

  if (error) {
    const url = new URL(returnPath, req.url);
    url.searchParams.set("error", encodeURIComponent("Bulk approval failed."));
    return NextResponse.redirect(url);
  }

  const url = new URL(returnPath, req.url);
  url.searchParams.set("action", "listing_approved");
  return NextResponse.redirect(url);
}
