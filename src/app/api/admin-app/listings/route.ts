import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";
import { normalizePhotoUrls } from "@/lib/photoUrls";

const parseNumber = (value?: string | null) => {
  if (!value) return null;
  const cleaned = value.toLowerCase().replace(/,/g, "").trim();
  const lakhMatch = cleaned.match(/([\d.]+)\s*(l|lakh|lakhs)/);
  if (lakhMatch) {
    const base = Number(lakhMatch[1]);
    return Number.isFinite(base) ? Math.round(base * 100000) : null;
  }
  const num = Number(cleaned.replace(/[^0-9.]/g, ""));
  return Number.isFinite(num) ? Math.round(num) : null;
};

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as
    | {
        id?: string;
        listingType?: string;
        sellerName?: string;
        sellerPhone?: string;
        make?: string;
        model?: string;
        variant?: string;
        year?: string;
        fuel?: string;
        transmission?: string;
        kmDriven?: string;
        ownership?: string;
        price?: string;
        location?: string;
        exteriorColor?: string;
        registrationYear?: string;
        registrationState?: string;
        insuranceStatus?: string;
        fitnessStatus?: string;
        description?: string;
        featured?: boolean;
        status?: string;
        photoUrls?: string[];
        coverIndex?: number;
      }
    | null;

  if (!payload) {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  const sb = supabaseServer();
  const photoUrls = normalizePhotoUrls(payload.photoUrls ?? []);
  const coverIndex = Math.max(0, payload.coverIndex ?? 0);
  const coverPhotoUrl = photoUrls[coverIndex] ?? photoUrls[0] ?? null;

  const listingPayload = {
    listing_type: payload.listingType ?? "dealer",
    seller_name: payload.sellerName ?? null,
    seller_phone: payload.sellerPhone ?? null,
    make: payload.make ?? null,
    model: payload.model ?? null,
    variant: payload.variant ?? null,
    year: parseNumber(payload.year),
    fuel: payload.fuel ?? null,
    transmission: payload.transmission ?? null,
    km: parseNumber(payload.kmDriven),
    ownership: payload.ownership ?? null,
    price: parseNumber(payload.price),
    location: payload.location ?? null,
    exterior_color: payload.exteriorColor ?? null,
    registration_year: parseNumber(payload.registrationYear),
    registration_state: payload.registrationState ?? null,
    insurance_status: payload.insuranceStatus ?? null,
    fitness_status: payload.fitnessStatus ?? null,
    description: payload.description ?? null,
    featured: Boolean(payload.featured),
    status: payload.status ?? "draft",
    type: "used",
    photo_urls: photoUrls,
    cover_photo_url: coverPhotoUrl,
    created_by: auth.user?.id ?? null,
    updated_at: new Date().toISOString(),
  };

  let listingId = payload.id;
  if (listingId) {
    const { error } = await sb
      .from("listings")
      .update(listingPayload)
      .eq("id", listingId);
    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message || "Could not update listing." },
        { status: 500 }
      );
    }
  } else {
    const { data, error } = await sb
      .from("listings")
      .insert(listingPayload)
      .select("id")
      .single();
    if (error || !data?.id) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Could not create listing." },
        { status: 500 }
      );
    }
    listingId = data.id;
  }

  if (listingId) {
    await sb.from("listing_photos").delete().eq("listing_id", listingId);
    if (photoUrls.length > 0) {
      const rows = photoUrls.map((url, index) => ({
        listing_id: listingId,
        photo_url: url,
        sort_order: index,
        is_cover: index === coverIndex,
      }));
      await sb.from("listing_photos").insert(rows);
    }
  }

  return NextResponse.json({ ok: true, id: listingId });
}
