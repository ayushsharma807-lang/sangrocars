import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { buildPrivateSellerDescription } from "@/lib/privateSeller";
import { buildListingExperienceDescription } from "@/lib/listingExperience";
import { uploadListingPhotoFiles } from "@/lib/uploadListingPhotos";
import { DEFAULT_LISTING_SOURCE } from "@/lib/listingSource";

const parseNumber = (value: FormDataEntryValue | null) => {
  if (!value) return null;
  const num = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(num) ? Math.round(num) : null;
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

const toType = (value: FormDataEntryValue | null) => {
  const normalized = String(value ?? "used").trim().toLowerCase();
  return normalized === "new" ? "new" : "used";
};

const pickForwarded = (value: string | null) =>
  value?.split(",")[0]?.trim() || null;

const toRedirectUrl = (req: Request, path: string) => {
  const forwardedHost = pickForwarded(req.headers.get("x-forwarded-host"));
  const forwardedProto = pickForwarded(req.headers.get("x-forwarded-proto"));

  if (forwardedHost) {
    return new URL(path, `${forwardedProto || "https"}://${forwardedHost}`);
  }

  return new URL(path, req.url);
};

export async function POST(req: Request) {
  const form = await req.formData();
  const make = String(form.get("make") ?? "").trim();
  const model = String(form.get("model") ?? "").trim();
  const sellerPhone = String(form.get("seller_phone") ?? "").trim();

  if (!make || !model || !sellerPhone) {
    return NextResponse.redirect(
      toRedirectUrl(req, "/sell?error=missing_fields"),
      { status: 303 }
    );
  }

  const sellerDescription = buildPrivateSellerDescription(
    {
      name: String(form.get("seller_name") ?? "").trim(),
      phone: sellerPhone,
      email: String(form.get("seller_email") ?? "").trim(),
    },
    String(form.get("description") ?? "").trim()
  );
  const description = buildListingExperienceDescription(
    {
      tour360Url: String(form.get("tour_360_url") ?? "").trim(),
      walkthroughVideoUrl: String(form.get("walkthrough_video_url") ?? "").trim(),
      interiorVrUrl: String(form.get("interior_vr_url") ?? "").trim(),
      arModelUrl: String(form.get("ar_model_url") ?? "").trim(),
      arIosModelUrl: String(form.get("ar_ios_model_url") ?? "").trim(),
    },
    sellerDescription
  );

  const uploaded = await uploadListingPhotoFiles(
    form.getAll("photo_files"),
    `public/${Date.now()}`
  );
  const photoUrls = mergePhotoUrls(
    parsePhotos(form.get("photo_urls")),
    uploaded.urls
  );

  const payload = {
    source: DEFAULT_LISTING_SOURCE,
    dealer_id: null as string | null,
    type: toType(form.get("type")),
    status: "available",
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
    photo_urls: photoUrls,
  };

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("listings")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data?.id) {
    return NextResponse.redirect(toRedirectUrl(req, "/sell?error=create_failed"), {
      status: 303,
    });
  }

  return NextResponse.redirect(toRedirectUrl(req, `/listing/${data.id}?posted=1`), {
    status: 303,
  });
}
