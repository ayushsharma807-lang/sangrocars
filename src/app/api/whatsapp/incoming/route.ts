import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { parseListingText } from "@/lib/listingTextParser";
import { DEFAULT_LISTING_SOURCE } from "@/lib/listingSource";

const WHATSAPP_SYNC_TOKEN = process.env.WHATSAPP_SYNC_TOKEN ?? "";

type DealerLite = {
  id: string;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
};

type IncomingPayload = {
  from: string;
  body: string;
  photoUrls: string[];
  isTwilioForm: boolean;
};

const normalizePhone = (value?: string | null) => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};

const parseMediaUrls = (form: FormData) => {
  const urls: string[] = [];
  const numMedia = Number(String(form.get("NumMedia") ?? "0"));
  if (!Number.isFinite(numMedia) || numMedia <= 0) return urls;
  for (let idx = 0; idx < numMedia; idx += 1) {
    const key = `MediaUrl${idx}`;
    const value = form.get(key);
    if (!value) continue;
    const url = String(value).trim();
    if (url) urls.push(url);
  }
  return urls;
};

const parseIncomingPayload = async (req: Request): Promise<IncomingPayload> => {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const photos = Array.isArray(body.photo_urls)
      ? body.photo_urls.map((item) => String(item)).filter(Boolean)
      : Array.isArray(body.photoUrls)
        ? body.photoUrls.map((item) => String(item)).filter(Boolean)
        : [];
    return {
      from: String(body.from ?? body.phone ?? ""),
      body: String(body.body ?? body.message ?? body.text ?? ""),
      photoUrls: photos,
      isTwilioForm: false,
    };
  }

  const form = await req.formData();
  return {
    from: String(form.get("From") ?? form.get("from") ?? ""),
    body: String(form.get("Body") ?? form.get("body") ?? ""),
    photoUrls: parseMediaUrls(form),
    isTwilioForm: true,
  };
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const twiml = (message: string) =>
  `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;

const findDealerByPhone = async (phone: string) => {
  const digits = normalizePhone(phone);
  if (!digits) return null;

  const sb = supabaseServer();
  const candidates = Array.from(
    new Set([
      digits,
      digits.slice(-12),
      digits.slice(-10),
      digits.startsWith("91") ? digits.slice(2) : "",
    ].filter(Boolean))
  );

  for (const candidate of candidates) {
    const { data, error } = await sb
      .from("dealers")
      .select("id, name, phone, whatsapp")
      .or(`phone.ilike.%${candidate}%,whatsapp.ilike.%${candidate}%`)
      .limit(5);
    if (error) continue;
    const rows = (data ?? []) as DealerLite[];
    if (rows.length === 0) continue;

    const exact = rows.find((row) => {
      const phoneDigits = normalizePhone(row.phone);
      const whatsappDigits = normalizePhone(row.whatsapp);
      return (
        phoneDigits.endsWith(candidate) || whatsappDigits.endsWith(candidate)
      );
    });
    return exact ?? rows[0];
  }

  return null;
};

const normalizeType = (value: string) => (value === "new" ? "new" : "used");
const normalizeStatus = (value: string) => (value === "sold" ? "sold" : "available");

const createListingFromMessage = async (dealerId: string, text: string, media: string[]) => {
  const parsed = parseListingText(text, media);
  const make = parsed.make?.trim() ?? "";
  const model = parsed.model?.trim() ?? "";
  if (!make || !model) {
    return { ok: false as const, error: "Please include make and model in message." };
  }

  const sb = supabaseServer();
  const payload = {
    source: DEFAULT_LISTING_SOURCE,
    dealer_id: dealerId,
    type: normalizeType(parsed.type),
    status: normalizeStatus(parsed.status),
    make,
    model,
    variant: parsed.variant?.trim() || null,
    year: parsed.year,
    price: parsed.price,
    km: parsed.km,
    fuel: parsed.fuel?.trim() || null,
    transmission: parsed.transmission?.trim() || null,
    location: parsed.location?.trim() || null,
    description: parsed.description || text.trim() || null,
    photo_urls: parsed.photo_urls,
  };

  const { data, error } = await sb
    .from("listings")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data?.id) {
    return {
      ok: false as const,
      error: error?.message ?? "Unable to create listing.",
    };
  }

  return { ok: true as const, listingId: String(data.id) };
};

export async function POST(req: Request) {
  if (!WHATSAPP_SYNC_TOKEN) {
    return NextResponse.json(
      {
        ok: false,
        error: "WHATSAPP_SYNC_TOKEN is not configured",
      },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const token =
    req.headers.get("x-whatsapp-token") ||
    searchParams.get("token") ||
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    "";

  if (token !== WHATSAPP_SYNC_TOKEN) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await parseIncomingPayload(req);
  const dealer = await findDealerByPhone(payload.from);
  if (!dealer) {
    if (payload.isTwilioForm) {
      return new Response(twiml("Dealer phone is not mapped in CarHub yet."), {
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }
    return NextResponse.json(
      { ok: false, error: "Dealer not found for sender phone." },
      { status: 404 }
    );
  }

  const created = await createListingFromMessage(
    dealer.id,
    payload.body,
    payload.photoUrls
  );
  if (!created.ok) {
    if (payload.isTwilioForm) {
      return new Response(twiml(created.error), {
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      });
    }
    return NextResponse.json({ ok: false, error: created.error }, { status: 400 });
  }

  if (payload.isTwilioForm) {
    return new Response(
      twiml(`Done. Listing created for ${dealer.name ?? "dealer"} (ID: ${created.listingId}).`),
      {
        headers: { "Content-Type": "text/xml; charset=utf-8" },
      }
    );
  }

  return NextResponse.json({
    ok: true,
    listing_id: created.listingId,
    dealer_id: dealer.id,
    dealer_name: dealer.name,
  });
}
