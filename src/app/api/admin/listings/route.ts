import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { buildPrivateSellerDescription } from "@/lib/privateSeller";
import { buildListingExperienceDescription } from "@/lib/listingExperience";
import { uploadListingPhotoFiles } from "@/lib/uploadListingPhotos";
import { DEFAULT_LISTING_SOURCE } from "@/lib/listingSource";
import { withDealerSubmittedPrice } from "@/lib/listingApproval";

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

const toStatus = (value: FormDataEntryValue | null) => {
  const normalized = String(value ?? "available").trim().toLowerCase();
  return normalized === "sold" ? "sold" : "available";
};

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const form = await req.formData();
  const wantsJson = req.headers.get("x-admin-form") === "1";
  const make = String(form.get("make") ?? "").trim();
  const model = String(form.get("model") ?? "").trim();
  if (!make || !model) {
    if (wantsJson) {
      return NextResponse.json(
        { ok: false, error: "missing_fields" },
        { status: 400 }
      );
    }
    return NextResponse.redirect(
      new URL("/admin/listings/new?error=missing_fields", req.url)
    );
  }

  const dealerIdRaw = String(form.get("dealer_id") ?? "").trim();
  const dealerId = dealerIdRaw && dealerIdRaw !== "none" ? dealerIdRaw : null;
  const isPrivateSeller = !dealerId;
  const sellerName = String(form.get("seller_name") ?? "").trim();
  const sellerPhone = String(form.get("seller_phone") ?? "").trim();
  const sellerEmail = String(form.get("seller_email") ?? "").trim();
  if (isPrivateSeller && (!sellerName || !sellerPhone)) {
    const body = {
      ok: false,
      error: "private_seller_missing",
      message: "Private seller name and phone are required when no dealer is selected.",
    };
    if (wantsJson) {
      return NextResponse.json(body, { status: 400 });
    }
    return NextResponse.redirect(
      new URL("/admin/listings/new?error=private_seller_missing", req.url)
    );
  }
  const netPrice = parseNumber(form.get("net_price"));
  const privateSellerDescription = buildPrivateSellerDescription(
    {
      name: sellerName,
      phone: sellerPhone,
      email: sellerEmail,
    },
    String(form.get("description") ?? "").trim()
  );
  const description = withDealerSubmittedPrice(buildListingExperienceDescription(
    {
      tour360Url: String(form.get("tour_360_url") ?? "").trim(),
      walkthroughVideoUrl: String(form.get("walkthrough_video_url") ?? "").trim(),
      interiorVrUrl: String(form.get("interior_vr_url") ?? "").trim(),
      arModelUrl: String(form.get("ar_model_url") ?? "").trim(),
      arIosModelUrl: String(form.get("ar_ios_model_url") ?? "").trim(),
    },
    privateSellerDescription
  ), netPrice);

  let uploaded: Awaited<ReturnType<typeof uploadListingPhotoFiles>>;
  try {
    uploaded = await uploadListingPhotoFiles(
      form.getAll("photo_files"),
      `admin/${Date.now()}`
    );
  } catch (error) {
    console.error("Admin listing photo upload failed", {
      error,
      dealerId,
      isPrivateSeller,
      make,
      model,
    });
    const body = {
      ok: false,
      error: "photo_upload_failed",
      message: "Photo upload failed while creating the listing.",
    };
    if (wantsJson) {
      return NextResponse.json(body, { status: 500 });
    }
    return NextResponse.redirect(
      new URL("/admin/listings/new?error=photo_upload_failed", req.url)
    );
  }
  const photoUrls = mergePhotoUrls(
    parsePhotos(form.get("photo_urls")),
    uploaded.urls
  );

  const payload = {
    source: isPrivateSeller ? "individual" : DEFAULT_LISTING_SOURCE,
    dealer_id: dealerId,
    type: toType(form.get("type")),
    status: toStatus(form.get("status")),
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
  const { data, error } = await sb.from("listings").insert(payload).select("id").single();

  if (error || !data?.id) {
    console.error("Admin listing create failed", {
      dealerId,
      isPrivateSeller,
      sellerName: sellerName || null,
      sellerPhone: sellerPhone || null,
      payload,
      uploadErrors: uploaded.errors,
      error,
    });
    const body = {
      ok: false,
      error: "create_failed",
      message: error?.message ?? "Could not create listing. Please try again.",
    };
    if (wantsJson) {
      return NextResponse.json(body, { status: 500 });
    }
    return NextResponse.redirect(
      new URL("/admin/listings/new?error=create_failed", req.url)
    );
  }

  if (wantsJson) {
    return NextResponse.json({
      ok: true,
      id: data.id,
      redirectTo: `/admin/listings/new?status=created&id=${data.id}`,
    });
  }

  return NextResponse.redirect(
    new URL(`/admin/listings/new?status=created&id=${data.id}`, req.url)
  );
}
