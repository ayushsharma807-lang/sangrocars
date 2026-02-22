import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireDealer } from "@/lib/dealerAuth";
import { uploadListingPhotoFiles } from "@/lib/uploadListingPhotos";
import { buildListingExperienceDescription } from "@/lib/listingExperience";

const parseNumber = (value: FormDataEntryValue | null) => {
  if (!value) return null;
  const num = Number(String(value));
  return Number.isFinite(num) ? num : null;
};

const parsePhotos = (value: FormDataEntryValue | null) => {
  if (!value) return [];
  return String(value)
    .split(/[\n,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const mergePhotoUrls = (manualUrls: string[], uploadedUrls: string[]) =>
  Array.from(new Set([...manualUrls, ...uploadedUrls]));

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await requireDealer();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/dealer-admin/login", req.url));
  }

  const form = await req.formData();
  const uploaded = await uploadListingPhotoFiles(
    form.getAll("photo_files"),
    `dealer/${auth.dealer.id}`
  );
  const photoUrls = mergePhotoUrls(
    parsePhotos(form.get("photo_urls")),
    uploaded.urls
  );
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
    price: parseNumber(form.get("price")),
    location: String(form.get("location") ?? "").trim() || null,
    description,
    status: String(form.get("status") ?? "available"),
    photo_urls: photoUrls,
  };

  const sb = supabaseServer();
  const { data: listing } = await sb
    .from("listings")
    .select("id, dealer_id")
    .eq("id", id)
    .single();

  if (!listing || listing.dealer_id !== auth.dealer.id) {
    return NextResponse.redirect(new URL("/dealer-admin/listings", req.url));
  }

  await sb.from("listings").update(payload).eq("id", id);
  return NextResponse.redirect(new URL(`/dealer-admin/listings/${id}`, req.url));
}
