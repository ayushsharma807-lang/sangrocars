import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

type LeadPayload = {
  listing_id?: string;
  dealer_id?: string | null;
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  source?: string;
  listing_title?: string;
};

const normalizePhone = (value?: string) => {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits || null;
};

const isMissingSchema = (message?: string | null) => {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return (
    lowered.includes("does not exist") ||
    lowered.includes("relation") ||
    lowered.includes("column") ||
    lowered.includes("could not find the table") ||
    lowered.includes("schema cache")
  );
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as LeadPayload | null;
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload" },
      { status: 400 }
    );
  }

  const name = body.name?.trim();
  const phone = normalizePhone(body.phone);
  if (!name || !phone) {
    return NextResponse.json(
      { ok: false, error: "Name and phone are required" },
      { status: 400 }
    );
  }

  const sb = supabaseServer();
  const primaryPayload = {
    listing_id: body.listing_id ?? null,
    dealer_id: body.dealer_id ?? null,
    name,
    phone,
    email: body.email?.trim() ?? null,
    message: body.message?.trim() ?? null,
    source: body.source ?? "website",
    listing_title: body.listing_title ?? null,
    status: "new",
  };

  const { error } = await sb.from("leads").insert(primaryPayload);

  if (error) {
    if (isMissingSchema(error.message)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Leads table is missing in Supabase. Run /Users/ayushsharma/carhub/supabase/setup.sql once.",
        },
        { status: 500 }
      );
    }

    const message = error.message.toLowerCase();
    if (message.includes("column") || message.includes("does not exist")) {
      const fallback = await sb.from("leads").insert({
        name,
        phone,
        email: body.email?.trim() ?? null,
        message: body.message?.trim() ?? null,
      });
      if (!fallback.error) {
        return NextResponse.json({ ok: true, warning: "fallback" });
      }
      return NextResponse.json(
        { ok: false, error: fallback.error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
