import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

const sanitizeReturnPath = (value: string, fallback: string) => {
  if (!value) return fallback;
  let decoded = value.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // keep original
  }
  if (!decoded.startsWith("/admin/listings")) {
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
    String(form.get("return") ?? "/admin/listings"),
    "/admin/listings"
  );

  const sb = supabaseServer();
  const deleteLeads = await sb.from("leads").delete().eq("listing_id", id);
  if (deleteLeads.error && !shouldIgnoreError(deleteLeads.error.message)) {
    return NextResponse.redirect(
      withStatus(req, returnPath, "error", encodeURIComponent(deleteLeads.error.message))
    );
  }

  const deleteListing = await sb.from("listings").delete().eq("id", id);
  if (deleteListing.error) {
    return NextResponse.redirect(
      withStatus(req, returnPath, "error", encodeURIComponent(deleteListing.error.message))
    );
  }

  return NextResponse.redirect(withStatus(req, returnPath, "action", "listing_deleted"));
}
