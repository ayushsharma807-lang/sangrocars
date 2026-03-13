import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { buildListingExperienceDescription } from "@/lib/listingExperience";
import {
  clearListingPendingApproval,
  extractDealerSubmittedPrice,
  markListingPendingApproval,
  withDealerSubmittedPrice,
} from "@/lib/listingApproval";

const parseNumber = (value: FormDataEntryValue | null) => {
  if (!value) return null;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? Math.round(num) : null;
};

const parsePhotos = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split(/[\n,|]/)
    .map((item) => item.trim())
    .filter(Boolean);

const dedupe = (items: string[]) => Array.from(new Set(items));

const toType = (value: FormDataEntryValue | null) => {
  const normalized = String(value ?? "used").trim().toLowerCase();
  return normalized === "new" ? "new" : "used";
};

const toStatus = (value: FormDataEntryValue | null) => {
  const normalized = String(value ?? "available").trim().toLowerCase();
  if (normalized === "sold") return "sold" as const;
  if (normalized === "pending") return "pending" as const;
  return "available" as const;
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/admin/login?error=unauthorized", req.url));
  }

  const { id } = await params;
  const form = await req.formData();
  const make = String(form.get("make") ?? "").trim();
  const model = String(form.get("model") ?? "").trim();

  if (!make || !model) {
    const url = new URL(`/admin/listings/${id}`, req.url);
    url.searchParams.set("error", encodeURIComponent("Make and model are required."));
    return NextResponse.redirect(url);
  }

  const sb = supabaseServer();
  const { data: current, error: currentError } = await sb
    .from("listings")
    .select("id, description, status, price")
    .eq("id", id)
    .single();

  if (currentError || !current) {
    return NextResponse.redirect(new URL("/admin/listings", req.url));
  }

  const selectedStatus = toStatus(form.get("status"));
  const cleanDescription = buildListingExperienceDescription(
    {
      tour360Url: "",
      walkthroughVideoUrl: "",
      interiorVrUrl: "",
      arModelUrl: "",
      arIosModelUrl: "",
    },
    String(form.get("description") ?? "").trim()
  );
  const netPrice = extractDealerSubmittedPrice(current.description) ?? current.price ?? null;
  let description = withDealerSubmittedPrice(clearListingPendingApproval(cleanDescription), netPrice);

  if (selectedStatus === "pending") {
    description = markListingPendingApproval(description);
  }

  const dealerIdRaw = String(form.get("dealer_id") ?? "").trim();
  const dealerId = dealerIdRaw && dealerIdRaw !== "none" ? dealerIdRaw : null;

  const payload = {
    dealer_id: dealerId,
    type: toType(form.get("type")),
    status: selectedStatus === "pending" ? "sold" : selectedStatus,
    make,
    model,
    variant: String(form.get("variant") ?? "").trim() || null,
    year: parseNumber(form.get("year")),
    price: parseNumber(form.get("price")),
    km: parseNumber(form.get("km")),
    fuel: String(form.get("fuel") ?? "").trim() || null,
    transmission: String(form.get("transmission") ?? "").trim() || null,
    location: String(form.get("location") ?? "").trim() || null,
    description,
    photo_urls: dedupe(parsePhotos(form.get("photo_urls"))),
  };

  const { error } = await sb.from("listings").update(payload).eq("id", id);
  const url = new URL(`/admin/listings/${id}`, req.url);

  if (error) {
    url.searchParams.set("error", encodeURIComponent(error.message || "Could not save listing."));
    return NextResponse.redirect(url);
  }

  url.searchParams.set("status", "saved");
  return NextResponse.redirect(url);
}
