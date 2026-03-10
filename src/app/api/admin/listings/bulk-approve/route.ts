import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import {
  clearListingPendingApproval,
  isListingPendingApproval,
  withDealerSubmittedPrice,
} from "@/lib/listingApproval";

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
  const { data: rows, error: fetchError } = await sb
    .from("listings")
    .select("id, description, status, price")
    .in("id", ids);

  if (fetchError) {
    const url = new URL(returnPath, req.url);
    url.searchParams.set("error", encodeURIComponent("Bulk approval failed."));
    return NextResponse.redirect(url);
  }

  const pendingRows = ((rows ?? []) as {
    id: string;
    description?: string | null;
    status?: string | null;
    price?: number | null;
  }[])
    .filter((row) => isListingPendingApproval(row));

  if (!pendingRows.length) {
    const url = new URL(returnPath, req.url);
    url.searchParams.set("error", encodeURIComponent("No pending listings selected."));
    return NextResponse.redirect(url);
  }

  const updates = await Promise.all(
    pendingRows.map((row) =>
      sb
        .from("listings")
        .update({
          status: "available",
          price,
          description: withDealerSubmittedPrice(
            clearListingPendingApproval(row.description),
            row.price ?? null
          ),
        })
        .eq("id", row.id)
    )
  );
  const error = updates.find((result) => result.error)?.error;

  if (error) {
    const url = new URL(returnPath, req.url);
    url.searchParams.set("error", encodeURIComponent("Bulk approval failed."));
    return NextResponse.redirect(url);
  }

  const url = new URL(returnPath, req.url);
  url.searchParams.set("action", "listing_approved");
  return NextResponse.redirect(url);
}
