import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

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

const uploadFile = async (file: File, bucket: string, prefix: string) => {
  const sb = supabaseServer();
  const ext = file.name?.split(".").pop()?.toLowerCase() ?? "png";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "png";
  const path = `${prefix}/${Date.now()}.${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage.from(bucket).upload(path, buffer, {
    upsert: true,
    contentType: file.type || "image/png",
  });
  if (error) return null;
  const { data } = sb.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
};

export async function POST(req: Request) {
  const form = await req.formData();
  const name = sanitize(form.get("name"));
  const ownerName = sanitize(form.get("owner_name"));
  const phone = sanitize(form.get("phone"));
  const whatsapp = sanitize(form.get("whatsapp")) || phone;
  const email = sanitize(form.get("email"));
  const city = sanitize(form.get("city"));
  const address = sanitize(form.get("address"));
  const website = sanitize(form.get("website"));

  if (!name || !ownerName || !phone || !email || !city || !address) {
    return NextResponse.redirect(new URL("/dealers/register?error=missing_fields", req.url));
  }

  const logoFile = form.get("logo_file");
  const bannerFile = form.get("banner_file");
  let logoUrl: string | null = null;
  let bannerUrl: string | null = null;

  if (logoFile && typeof logoFile !== "string" && logoFile.size > 0) {
    logoUrl = await uploadFile(logoFile, LOGO_BUCKET, "dealer-logo");
  }
  if (bannerFile && typeof bannerFile !== "string" && bannerFile.size > 0) {
    bannerUrl = await uploadFile(bannerFile, BANNER_BUCKET, "dealer-banner");
  }

  const services = {
    finance: Boolean(form.get("service_finance")),
    insurance: Boolean(form.get("service_insurance")),
    rc_transfer: Boolean(form.get("service_rc")),
    test_drive: Boolean(form.get("service_test_drive")),
  };

  const servicesLabel = [
    services.finance ? "Finance available" : null,
    services.insurance ? "Insurance assistance" : null,
    services.rc_transfer ? "RC transfer help" : null,
    services.test_drive ? "Test drive available" : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const baseDescription = servicesLabel
    ? `Services: ${servicesLabel}`
    : null;

  const payloadFull: Record<string, string | boolean | null> = {
    name,
    dealer_name: name,
    owner_name: ownerName,
    phone: phone || null,
    whatsapp: whatsapp || null,
    email: email || null,
    contact_email: email || null,
    owner_email: email || null,
    address: address || null,
    city: city || null,
    location: city || null,
    website: website || null,
    logo_url: logoUrl,
    banner_url: bannerUrl,
    finance_available: services.finance,
    insurance_assistance: services.insurance,
    rc_transfer_help: services.rc_transfer,
    test_drive_available: services.test_drive,
    description: baseDescription,
  };

  const payloadMinimal: Record<string, string | null> = {
    name,
    phone: phone || null,
    whatsapp: whatsapp || null,
    email: email || null,
    address: address || null,
    location: city || null,
    logo_url: logoUrl,
    description: baseDescription,
  };

  const sb = supabaseServer();
  const created = await sb.from("dealers").insert(payloadFull).select("id").single();

  if (created.error && isMissingSchema(created.error.message)) {
    const fallback = await sb
      .from("dealers")
      .insert(payloadMinimal)
      .select("id")
      .single();
    if (fallback.error) {
      return NextResponse.redirect(new URL("/dealers/register?error=create_failed", req.url));
    }
    return NextResponse.redirect(new URL("/dealers/register?status=created", req.url));
  }

  if (created.error || !created.data?.id) {
    return NextResponse.redirect(new URL("/dealers/register?error=create_failed", req.url));
  }

  return NextResponse.redirect(new URL("/dealers/register?status=created", req.url));
}
