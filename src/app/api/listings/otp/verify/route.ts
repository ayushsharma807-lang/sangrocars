import { NextResponse } from "next/server";
import { normalizePhoneForAuth } from "@/lib/phone";
import { buildPhoneVerificationCookie } from "@/lib/phoneVerification";

const parsePayload = async (req: Request) => {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const data = await req.json().catch(() => null);
    return typeof data === "object" && data ? data : null;
  }
  const form = await req.formData().catch(() => null);
  if (!form) return null;
  return Object.fromEntries(form.entries());
};

export async function POST(req: Request) {
  const body = await parsePayload(req);
  const phone = normalizePhoneForAuth(String(body?.phone ?? ""));
  const token = String(body?.token ?? "").trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!phone || !token) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json({ ok: false, error: "config_missing" }, { status: 500 });
  }

  const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnon,
    },
    body: JSON.stringify({
      type: "sms",
      phone,
      token,
    }),
  }).catch(() => null);

  if (!verifyResponse?.ok) {
    return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 400 });
  }

  const cookie = buildPhoneVerificationCookie(phone);
  if (!cookie) {
    return NextResponse.json({ ok: false, error: "config_missing" }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true, status: "verified" });
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: cookie.maxAge,
    path: "/",
  });

  return response;
}
