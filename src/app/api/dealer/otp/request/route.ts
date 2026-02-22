import { NextResponse } from "next/server";
import { normalizePhoneForAuth } from "@/lib/phone";

const sanitizeNextPath = (value: string) => {
  if (!value) return "/dealer-admin";
  if (value.startsWith("/dealer-admin")) return value;
  return "/dealer-admin";
};

export async function POST(req: Request) {
  const form = await req.formData();
  const modeRaw = String(form.get("mode") ?? "login").toLowerCase();
  const mode = modeRaw === "signup" ? "signup" : "login";
  const phone = normalizePhoneForAuth(String(form.get("phone") ?? ""));
  const name = String(form.get("name") ?? "").trim();
  const city = String(form.get("city") ?? "").trim();
  const nextPath = sanitizeNextPath(String(form.get("next") ?? "/dealer-admin"));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const backUrl =
    mode === "signup"
      ? new URL("/dealer-admin/signup", req.url)
      : new URL("/dealer-admin/login", req.url);

  if (!phone) {
    backUrl.searchParams.set("error", "invalid_phone");
    backUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(backUrl);
  }

  if (!supabaseUrl || !supabaseAnon) {
    backUrl.searchParams.set("error", "config");
    backUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(backUrl);
  }

  const otpResponse = await fetch(`${supabaseUrl}/auth/v1/otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnon,
    },
    body: JSON.stringify({
      phone,
      create_user: mode === "signup",
      channel: "sms",
      data:
        mode === "signup"
          ? {
              role: "dealer",
              dealer_name: name || undefined,
              city: city || undefined,
              phone,
            }
          : undefined,
    }),
  }).catch(() => null);

  if (!otpResponse?.ok) {
    const err = await otpResponse?.json().catch(() => null);
    const message = String(err?.msg ?? err?.error_description ?? "").toLowerCase();
    if (message.includes("phone") && message.includes("not found")) {
      backUrl.searchParams.set("error", "dealer_not_found");
    } else if (message.includes("rate limit")) {
      backUrl.searchParams.set("error", "rate_limited");
    } else {
      backUrl.searchParams.set("error", "otp_send_failed");
    }
    backUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(backUrl);
  }

  const otpUrl = new URL("/dealer-admin/otp", req.url);
  otpUrl.searchParams.set("mode", mode);
  otpUrl.searchParams.set("phone", phone);
  otpUrl.searchParams.set("next", nextPath);
  otpUrl.searchParams.set("status", "sent");
  if (name) otpUrl.searchParams.set("name", name);
  if (city) otpUrl.searchParams.set("city", city);
  return NextResponse.redirect(otpUrl);
}
