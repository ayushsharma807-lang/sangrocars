import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireDealer } from "@/lib/dealerAuth";

const LOGO_BUCKET = process.env.DEALER_LOGO_BUCKET ?? "dealer-logos";

const sanitize = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : "";

const uploadLogo = async (file: File, dealerId: string) => {
  const sb = supabaseServer();
  const ext = file.name?.split(".").pop()?.toLowerCase() ?? "png";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "png";
  const path = `${dealerId}/${Date.now()}.${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage
    .from(LOGO_BUCKET)
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type || "image/png",
    });
  if (error) {
    return { error };
  }
  const { data } = sb.storage.from(LOGO_BUCKET).getPublicUrl(path);
  return { url: data?.publicUrl ?? null };
};

export async function POST(req: Request) {
  const auth = await requireDealer();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/dealer-admin/login", req.url));
  }

  const form = await req.formData();
  const logoFile = form.get("logo_file");
  let logoUrl = sanitize(form.get("logo_url")) || null;
  if (logoFile && typeof logoFile !== "string" && logoFile.size > 0) {
    const upload = await uploadLogo(logoFile, auth.dealer.id);
    if (!upload.error && upload.url) {
      logoUrl = upload.url;
    }
  }

  const payload = {
    name: sanitize(form.get("name")),
    phone: sanitize(form.get("phone")) || null,
    whatsapp: sanitize(form.get("whatsapp")) || null,
    email: sanitize(form.get("email")) || null,
    address: sanitize(form.get("address")) || null,
    description: sanitize(form.get("description")) || null,
    logo_url: logoUrl,
    feed_url: sanitize(form.get("feed_url")) || null,
    inventory_url: sanitize(form.get("inventory_url")) || null,
    sitemap_url: sanitize(form.get("sitemap_url")) || null,
  };

  const sb = supabaseServer();
  await sb.from("dealers").update(payload).eq("id", auth.dealer.id);

  return NextResponse.redirect(new URL("/dealer-admin/profile", req.url));
}
