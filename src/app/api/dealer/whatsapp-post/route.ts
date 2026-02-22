import { NextResponse } from "next/server";
import { requireDealer } from "@/lib/dealerAuth";
import { supabaseServer } from "@/lib/supabase";
import { parseListingText, extractUrlsFromText } from "@/lib/listingTextParser";
import { DEFAULT_LISTING_SOURCE } from "@/lib/listingSource";

const parsePhotos = (value: FormDataEntryValue | null) => {
  if (!value) return [] as string[];
  return String(value)
    .split(/[\n,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeType = (value: string) => (value === "new" ? "new" : "used");
const normalizeStatus = (value: string) => (value === "sold" ? "sold" : "available");

export async function POST(req: Request) {
  const auth = await requireDealer();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/dealer-admin/login", req.url));
  }

  const form = await req.formData();
  const rawMessage = String(form.get("message") ?? "").trim();
  const manualPhotos = parsePhotos(form.get("photo_urls"));
  const extraLinks = extractUrlsFromText(rawMessage);

  if (!rawMessage) {
    return NextResponse.redirect(
      new URL("/dealer-admin/whatsapp?error=empty_message", req.url)
    );
  }

  const parsed = parseListingText(rawMessage, [...manualPhotos, ...extraLinks]);
  if (!parsed.make || !parsed.model) {
    return NextResponse.redirect(
      new URL("/dealer-admin/whatsapp?error=missing_make_model", req.url)
    );
  }

  const payload = {
    source: DEFAULT_LISTING_SOURCE,
    dealer_id: auth.dealer.id,
    type: normalizeType(parsed.type),
    status: normalizeStatus(parsed.status),
    make: parsed.make,
    model: parsed.model,
    variant: parsed.variant || null,
    year: parsed.year,
    price: parsed.price,
    km: parsed.km,
    fuel: parsed.fuel || null,
    transmission: parsed.transmission || null,
    location: parsed.location || null,
    description: parsed.description || rawMessage,
    photo_urls: parsed.photo_urls,
  };

  const sb = supabaseServer();
  const { error } = await sb.from("listings").insert(payload);

  if (error) {
    return NextResponse.redirect(
      new URL("/dealer-admin/whatsapp?error=create_failed", req.url)
    );
  }

  return NextResponse.redirect(
    new URL("/dealer-admin/listings?created=whatsapp", req.url)
  );
}
