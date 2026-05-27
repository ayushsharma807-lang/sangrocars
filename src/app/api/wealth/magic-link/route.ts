import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { resolveLoginEmail } from "@/lib/servicesPortalAuth";

const sanitizeNextPath = (value: string) => {
  if (!value) return "/wealth/dashboard";
  try {
    const decoded = decodeURIComponent(value.trim());
    return decoded.startsWith("/wealth") ? decoded : "/wealth/dashboard";
  } catch {
    return "/wealth/dashboard";
  }
};

export async function POST(req: Request) {
  const form = await req.formData();
  const identifier = String(form.get("identifier") ?? "").trim();
  const nextPath = sanitizeNextPath(String(form.get("next") ?? ""));
  const loginUrl = new URL("/wealth/login", req.url);
  loginUrl.searchParams.set("next", nextPath);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) {
    console.error("Wealth magic link config missing");
    loginUrl.searchParams.set("error", "config");
    return NextResponse.redirect(loginUrl);
  }

  const email = await resolveLoginEmail(identifier);
  if (!email) {
    loginUrl.searchParams.set("error", "magic");
    return NextResponse.redirect(loginUrl);
  }

  const callbackUrl = new URL("/wealth/auth/callback", req.url);
  callbackUrl.searchParams.set("next", nextPath);

  const sb = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false },
  });

  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      shouldCreateUser: false,
    },
  });

  if (error) {
    console.error("Wealth magic link failed", error);
    loginUrl.searchParams.set("error", "magic");
    return NextResponse.redirect(loginUrl);
  }

  loginUrl.searchParams.set("magic_sent", "1");
  return NextResponse.redirect(loginUrl);
}
