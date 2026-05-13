import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

type ServiceLeadPayload = {
  service_type?: "finance" | "insurance" | "mutual_funds" | "properties" | "cars";
  name?: string;
  phone?: string;
  city?: string;
  message?: string;
};

const ALLOWED_SERVICE_TYPES = new Set([
  "finance",
  "insurance",
  "mutual_funds",
  "properties",
  "cars",
]);

const ALLOWED_ORIGINS = new Set([
  "https://sangrocars.in",
  "https://www.sangrocars.in",
  "http://localhost:3000",
]);

const corsHeaders = (origin?: string | null) => {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  });

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
};

const normalizePhone = (value?: string) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits || null;
};

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

export async function POST(req: Request) {
  const headers = corsHeaders(req.headers.get("origin"));
  const body = (await req.json().catch(() => null)) as ServiceLeadPayload | null;

  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload" },
      { status: 400, headers }
    );
  }

  const serviceType = String(body.service_type ?? "").trim();
  const name = String(body.name ?? "").trim();
  const phone = normalizePhone(body.phone);
  const city = String(body.city ?? "").trim() || null;
  const message = String(body.message ?? "").trim() || null;

  if (!ALLOWED_SERVICE_TYPES.has(serviceType)) {
    return NextResponse.json(
      { ok: false, error: "Invalid service type" },
      { status: 400, headers }
    );
  }

  if (!name || !phone) {
    return NextResponse.json(
      { ok: false, error: "Name and phone are required" },
      { status: 400, headers }
    );
  }

  try {
    const sb = supabaseServer();
    const { error } = await sb.from("service_leads").insert({
      service_type: serviceType,
      name,
      phone,
      city,
      message,
      status: "new",
    });

    if (error) {
      console.error("Service lead insert failed", {
        error: error.message,
        payload: { serviceType, name, phone, city, message },
      });
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers }
      );
    }

    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    console.error("Service lead insert crashed", error);
    return NextResponse.json(
      { ok: false, error: "Unexpected server error." },
      { status: 500, headers }
    );
  }
}
