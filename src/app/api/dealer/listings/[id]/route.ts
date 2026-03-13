import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireDealer } from "@/lib/dealerAuth";
import { buildListingExperienceDescription } from "@/lib/listingExperience";
import { parseIndianMoney } from "@/lib/parseIndianMoney";
import {
  markListingPendingApproval,
  withDealerSubmittedPrice,
} from "@/lib/listingApproval";

const parseNumber = (value: FormDataEntryValue | null) => {
  if (!value) return null;
  const num = Number(String(value));
  return Number.isFinite(num) ? num : null;
};

const parsePrice = (value: FormDataEntryValue | null) => {
  if (!value) return null;
  return parseIndianMoney(String(value));
};

const parsePhotos = (value: FormDataEntryValue | null) => {
  if (!value) return [];
  return String(value)
    .split(/[\n,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const dedupePhotoUrls = (urls: string[]) => Array.from(new Set(urls));

const wantsJson = (req: Request) =>
  req.headers.get("x-requested-with") === "XMLHttpRequest" ||
  req.headers.get("accept")?.includes("application/json");

const respondError = (req: Request, path: string, error: string, status = 400) => {
  if (wantsJson(req)) {
    return NextResponse.json({ ok: false, error }, { status });
  }
  return NextResponse.redirect(new URL(path, req.url));
};

const respondSuccess = (req: Request, path: string) => {
  if (wantsJson(req)) {
    return NextResponse.json({ ok: true, redirectTo: new URL(path, req.url).toString() });
  }
  return NextResponse.redirect(new URL(path, req.url));
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireDealer();
  if (!auth.ok) {
    return respondError(req, "/dealer-admin/login", "Please sign in again.", 401);
  }

  const form = await req.formData();
  const submittedPrice = parsePrice(form.get("price"));
  const photoUrls = dedupePhotoUrls(parsePhotos(form.get("photo_urls")));
  const description = buildListingExperienceDescription(
    {
      tour360Url: String(form.get("tour_360_url") ?? "").trim(),
      walkthroughVideoUrl: String(form.get("walkthrough_video_url") ?? "").trim(),
      interiorVrUrl: String(form.get("interior_vr_url") ?? "").trim(),
      arModelUrl: String(form.get("ar_model_url") ?? "").trim(),
      arIosModelUrl: String(form.get("ar_ios_model_url") ?? "").trim(),
    },
    String(form.get("description") ?? "").trim()
  );
  const payload = {
    type: String(form.get("type") ?? "used"),
    make: String(form.get("make") ?? "").trim(),
    model: String(form.get("model") ?? "").trim(),
    variant: String(form.get("variant") ?? "").trim() || null,
    year: parseNumber(form.get("year")),
    km: parseNumber(form.get("km")),
    fuel: String(form.get("fuel") ?? "").trim() || null,
    transmission: String(form.get("transmission") ?? "").trim() || null,
    price: submittedPrice,
    location: String(form.get("location") ?? "").trim() || null,
    description: markListingPendingApproval(
      withDealerSubmittedPrice(description, submittedPrice)
    ),
    status: "sold",
    photo_urls: photoUrls,
  };

  const sb = supabaseServer();
  const { data: listing } = await sb
    .from("listings")
    .select("id, dealer_id")
    .eq("id", id)
    .single();

  if (!listing || listing.dealer_id !== auth.dealer.id) {
    return respondError(req, "/dealer-admin/listings", "Listing not found.", 404);
  }

  const { error } = await sb.from("listings").update(payload).eq("id", id);
  if (error) {
    return respondError(req, `/dealer-admin/listings/${id}`, error.message || "Could not save listing.", 500);
  }

  return respondSuccess(req, `/dealer-admin/listings/${id}`);
}
