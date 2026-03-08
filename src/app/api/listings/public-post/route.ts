import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { buildPrivateSellerDescription } from "@/lib/privateSeller";
import { buildListingExperienceDescription } from "@/lib/listingExperience";
import { uploadListingPhotoFiles } from "@/lib/uploadListingPhotos";
import { DEFAULT_LISTING_SOURCE } from "@/lib/listingSource";
import { phoneVariants } from "@/lib/phone";
import { verifyPhoneCookie } from "@/lib/phoneVerification";

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

const isMissingSchema = (message?: string | null) => {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return (
    lowered.includes("does not exist") ||
    lowered.includes("column") ||
    lowered.includes("could not find the table") ||
    lowered.includes("schema cache") ||
    lowered.includes("relation") ||
    lowered.includes("unknown")
  );
};

const isDuplicate = (message?: string | null) => {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return lowered.includes("duplicate") || lowered.includes("unique");
};

const findDealerByPhone = async (phone: string | null) => {
  if (!phone) return null;
  const sb = supabaseServer();
  for (const field of ["phone", "whatsapp"]) {
    for (const variant of phoneVariants(phone)) {
      const query = await sb
        .from("dealers")
        .select("id")
        .eq(field, variant)
        .limit(1)
        .maybeSingle();
      if (!query.error && query.data?.id) return String(query.data.id);
      if (query.error && !isMissingSchema(query.error.message)) return null;
    }
  }
  return null;
};

const findDealerByName = async (name: string | null) => {
  if (!name) return null;
  const sb = supabaseServer();
  const query = await sb
    .from("dealers")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  if (!query.error && query.data?.id) return String(query.data.id);
  if (query.error && !isMissingSchema(query.error.message)) return null;
  return null;
};

const upsertDealer = async ({
  name,
  phone,
  location,
  logoUrl,
  profileUrl,
}: {
  name: string;
  phone: string | null;
  location: string | null;
  logoUrl: string | null;
  profileUrl: string | null;
}) => {
  const existing =
    (await findDealerByPhone(phone)) || (await findDealerByName(name));
  const sb = supabaseServer();

  if (existing) {
    const updates: Record<string, string | null> = {
      name,
      phone: phone || null,
      whatsapp: phone || null,
      logo_url: logoUrl || null,
      inventory_url: profileUrl || null,
      address: location || null,
      location: location || null,
    };
    const updated = await sb.from("dealers").update(updates).eq("id", existing);
    if (updated.error && isMissingSchema(updated.error.message)) {
      await sb
        .from("dealers")
        .update({ name, phone: phone || null, whatsapp: phone || null })
        .eq("id", existing);
    }
    return existing;
  }

  const payloads: Record<string, string | null>[] = [
    {
      name,
      phone: phone || null,
      whatsapp: phone || null,
      logo_url: logoUrl || null,
      inventory_url: profileUrl || null,
      address: location || null,
      location: location || null,
    },
    {
      name,
      phone: phone || null,
      whatsapp: phone || null,
      logo_url: logoUrl || null,
      inventory_url: profileUrl || null,
    },
    {
      name,
      phone: phone || null,
      whatsapp: phone || null,
    },
    {
      name,
      phone: phone || null,
    },
  ];

  for (const payload of payloads) {
    const created = await sb
      .from("dealers")
      .insert(payload)
      .select("id")
      .single();
    if (!created.error && created.data?.id) return String(created.data.id);
    if (created.error && isDuplicate(created.error.message)) {
      const existingId =
        (await findDealerByPhone(phone)) || (await findDealerByName(name));
      if (existingId) return existingId;
    }
    if (created.error && !isMissingSchema(created.error.message)) continue;
  }

  return null;
};

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
  const sellerType = String(form.get("seller_type") ?? "private").trim();
  const dealerName = String(form.get("dealer_name") ?? "").trim();
  const dealerLogo = String(form.get("dealer_logo") ?? "").trim();
  const dealerProfile = String(form.get("dealer_profile") ?? "").trim();

  if (!make || !model || !sellerPhone) {
    return NextResponse.redirect(
      toRedirectUrl(req, "/sell?error=missing_fields"),
      { status: 303 }
    );
  }

  if (!verifyPhoneCookie(req, sellerPhone)) {
    return NextResponse.redirect(
      toRedirectUrl(req, "/sell?error=phone_unverified"),
      { status: 303 }
    );
  }

  let dealerId: string | null = null;
  if (sellerType.toLowerCase() === "dealer" && dealerName) {
    dealerId = await upsertDealer({
      name: dealerName,
      phone: sellerPhone,
      location: String(form.get("location") ?? "").trim() || null,
      logoUrl: dealerLogo || null,
      profileUrl: dealerProfile || null,
    });
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
    dealer_id: dealerId,
    type: toType(form.get("type")),
    status: "pending",
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
