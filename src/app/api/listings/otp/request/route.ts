import { NextResponse } from "next/server";
import { normalizePhoneForAuth } from "@/lib/phone";

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!phone) {
    return NextResponse.json({ ok: false, error: "invalid_phone" }, { status: 400 });
  }
  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json({ ok: false, error: "config_missing" }, { status: 500 });
  }

  const otpResponse = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnon,
    },
    body: JSON.stringify({
      phone,
      create_user: false,
      channel: "sms",
    }),
  }).catch(() => null);

  if (!otpResponse?.ok) {
    return NextResponse.json({ ok: false, error: "otp_send_failed" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, status: "sent" });
}
