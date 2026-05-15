import { NextResponse } from "next/server";
import {
  fetchPortalProfile,
  portalCookieNames,
  resolveLoginEmail,
  servicesCookieOptions,
} from "@/lib/servicesPortalAuth";

const sanitizeNextPath = (value: string, fallback: string) => {
  if (!value) return fallback;
  try {
    const decoded = decodeURIComponent(value.trim());
    if (decoded.startsWith("/")) return decoded;
  } catch {
    return fallback;
  }
  return fallback;
};

export async function POST(req: Request) {
  const form = await req.formData();
  const identifier = String(form.get("identifier") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const role = String(form.get("role") ?? "customer") === "admin" ? "admin" : "customer";
  const fallbackPath = role === "admin" ? "/services-admin" : "/services-portal";
  const nextPath = sanitizeNextPath(String(form.get("next") ?? fallbackPath), fallbackPath);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.redirect(new URL(`${fallbackPath}/login?error=config`, req.url));
  }

  const email = await resolveLoginEmail(identifier);
  if (!email || !password) {
    return NextResponse.redirect(new URL(`${fallbackPath}/login?error=invalid`, req.url));
  }

  const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnon,
    },
    body: JSON.stringify({
      email,
      password,
    }),
  }).catch(() => null);

  if (!authResponse?.ok) {
    return NextResponse.redirect(new URL(`${fallbackPath}/login?error=invalid`, req.url));
  }

  const payload = (await authResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: { id?: string };
  };

  if (!payload.access_token || !payload.refresh_token || !payload.user?.id) {
    return NextResponse.redirect(new URL(`${fallbackPath}/login?error=invalid`, req.url));
  }

  const profile = await fetchPortalProfile(payload.user.id);
  if (!profile || profile.role !== role) {
    return NextResponse.redirect(new URL(`${fallbackPath}/login?error=role`, req.url));
  }

  const response = NextResponse.redirect(new URL(nextPath, req.url));
  response.cookies.set(
    portalCookieNames.access,
    payload.access_token,
    servicesCookieOptions(payload.expires_in ?? 3600)
  );
  response.cookies.set(
    portalCookieNames.refresh,
    payload.refresh_token,
    servicesCookieOptions(60 * 60 * 24 * 30)
  );
  return response;
}
