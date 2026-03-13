import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireDealer } from "@/lib/dealerAuth";
import { extractDealerCode, withDealerCode } from "@/lib/dealerCode";

const LOGO_BUCKET = process.env.DEALER_LOGO_BUCKET ?? "dealer-logos";
const BANNER_BUCKET = process.env.DEALER_BANNER_BUCKET ?? "dealer-banners";

const sanitize = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : "";

const isMissingSchema = (message?: string | null) => {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return (
    lowered.includes("does not exist") ||
    lowered.includes("column") ||
    lowered.includes("could not find the table") ||
    lowered.includes("schema cache") ||
    lowered.includes("relation")
  );
};

const uploadAsset = async (file: File, dealerId: string, bucket: string, prefix: string) => {
  const sb = supabaseServer();
  const ext = file.name?.split(".").pop()?.toLowerCase() ?? "png";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "png";
  const path = `${dealerId}/${prefix}-${Date.now()}.${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage
    .from(bucket)
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type || "image/png",
    });
  if (error) {
    return { error };
  }
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return { url: data?.publicUrl ?? null };
};

export async function POST(req: Request) {
  const auth = await requireDealer();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/dealer-admin/login", req.url));
  }

  const form = await req.formData();
  const logoFile = form.get("logo_file");
  const bannerFile = form.get("banner_file");
  let logoUrl = sanitize(form.get("logo_url")) || null;
  let bannerUrl = sanitize(form.get("banner_url")) || null;

  if (logoFile && typeof logoFile !== "string" && logoFile.size > 0) {
    const upload = await uploadAsset(logoFile, auth.dealer.id, LOGO_BUCKET, "logo");
    if (!upload.error && upload.url) {
      logoUrl = upload.url;
    }
  }
  if (bannerFile && typeof bannerFile !== "string" && bannerFile.size > 0) {
    const upload = await uploadAsset(bannerFile, auth.dealer.id, BANNER_BUCKET, "banner");
    if (!upload.error && upload.url) {
      bannerUrl = upload.url;
    }
  }

  const services = {
    finance_available: Boolean(form.get("service_finance")),
    insurance_assistance: Boolean(form.get("service_insurance")),
    rc_transfer_help: Boolean(form.get("service_rc")),
    test_drive_available: Boolean(form.get("service_test_drive")),
  };

  const payload = {
    name: sanitize(form.get("name")),
    owner_name: sanitize(form.get("owner_name")) || null,
    phone: sanitize(form.get("phone")) || null,
    whatsapp: sanitize(form.get("whatsapp")) || null,
    email: sanitize(form.get("email")) || null,
    address: sanitize(form.get("address")) || null,
    city: sanitize(form.get("city")) || null,
    website: sanitize(form.get("website")) || null,
    description:
      withDealerCode(
        sanitize(form.get("description")) || null,
        extractDealerCode(auth.dealer.description)
      ) || null,
    logo_url: logoUrl,
    banner_url: bannerUrl,
    feed_url: sanitize(form.get("feed_url")) || null,
    inventory_url: sanitize(form.get("inventory_url")) || null,
    sitemap_url: sanitize(form.get("sitemap_url")) || null,
    ...services,
  };

  const sb = supabaseServer();
  const updated = await sb.from("dealers").update(payload).eq("id", auth.dealer.id);
  if (updated.error && isMissingSchema(updated.error.message)) {
    const minimalPayload = {
      name: sanitize(form.get("name")),
      phone: sanitize(form.get("phone")) || null,
      whatsapp: sanitize(form.get("whatsapp")) || null,
      email: sanitize(form.get("email")) || null,
      address: sanitize(form.get("address")) || null,
      description:
        withDealerCode(
          sanitize(form.get("description")) || null,
          extractDealerCode(auth.dealer.description)
        ) || null,
      logo_url: logoUrl,
      feed_url: sanitize(form.get("feed_url")) || null,
      inventory_url: sanitize(form.get("inventory_url")) || null,
      sitemap_url: sanitize(form.get("sitemap_url")) || null,
    };
    await sb.from("dealers").update(minimalPayload).eq("id", auth.dealer.id);
  }

  return NextResponse.redirect(new URL("/dealer-admin/profile", req.url));
}
