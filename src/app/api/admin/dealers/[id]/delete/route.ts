import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

const sanitizeReturnPath = (value: string, fallback: string) => {
  if (!value) return fallback;
  let decoded = value.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // keep raw value
  }
  if (!decoded.startsWith("/admin/dealers")) {
    return fallback;
  }
  return decoded;
};

const withStatus = (
  req: Request,
  path: string,
  key: "action" | "error",
  value: string
) => {
  const url = new URL(path, req.url);
  url.searchParams.set(key, value);
  return url;
};

const shouldIgnoreError = (message?: string | null) => {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return (
    lowered.includes("does not exist") ||
    lowered.includes("relation") ||
    lowered.includes("column")
  );
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/admin/login?error=unauthorized", req.url));
  }

  const form = await req.formData();
  const returnPath = sanitizeReturnPath(
    String(form.get("return") ?? "/admin/dealers"),
    "/admin/dealers"
  );

  const sb = supabaseServer();
  const { data: listings, error: listingsError } = await sb
    .from("listings")
    .select("id")
    .eq("dealer_id", id)
    .limit(20000);
  if (listingsError && !shouldIgnoreError(listingsError.message)) {
    return NextResponse.redirect(
      withStatus(req, returnPath, "error", encodeURIComponent(listingsError.message))
    );
  }

  const listingIds = (listings ?? [])
    .map((row) => String(row.id ?? ""))
    .filter(Boolean);

  const deleteDirectLeads = await sb.from("leads").delete().eq("dealer_id", id);
  if (deleteDirectLeads.error && !shouldIgnoreError(deleteDirectLeads.error.message)) {
    return NextResponse.redirect(
      withStatus(
        req,
        returnPath,
        "error",
        encodeURIComponent(deleteDirectLeads.error.message)
      )
    );
  }

  if (listingIds.length > 0) {
    const deleteListingLeads = await sb.from("leads").delete().in("listing_id", listingIds);
    if (
      deleteListingLeads.error &&
      !shouldIgnoreError(deleteListingLeads.error.message)
    ) {
      return NextResponse.redirect(
        withStatus(
          req,
          returnPath,
          "error",
          encodeURIComponent(deleteListingLeads.error.message)
        )
      );
    }
  }

  const deleteListings = await sb.from("listings").delete().eq("dealer_id", id);
  if (deleteListings.error && !shouldIgnoreError(deleteListings.error.message)) {
    return NextResponse.redirect(
      withStatus(req, returnPath, "error", encodeURIComponent(deleteListings.error.message))
    );
  }

  const deleteMappings = await sb.from("dealer_users").delete().eq("dealer_id", id);
  if (deleteMappings.error && !shouldIgnoreError(deleteMappings.error.message)) {
    return NextResponse.redirect(
      withStatus(
        req,
        returnPath,
        "error",
        encodeURIComponent(deleteMappings.error.message)
      )
    );
  }

  const deleteDealer = await sb.from("dealers").delete().eq("id", id);
  if (deleteDealer.error) {
    return NextResponse.redirect(
      withStatus(req, returnPath, "error", encodeURIComponent(deleteDealer.error.message))
    );
  }

  return NextResponse.redirect(withStatus(req, returnPath, "action", "dealer_deleted"));
}
