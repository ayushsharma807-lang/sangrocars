import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  fetchPortalProfile,
  portalCookieNames,
  servicesCookieOptions,
} from "@/lib/servicesPortalAuth";

const sanitizeNextPath = (value: string | null) => {
  if (!value) return "/wealth/dashboard";
  try {
    const decoded = decodeURIComponent(value.trim());
    return decoded.startsWith("/wealth") ? decoded : "/wealth/dashboard";
  } catch {
    return "/wealth/dashboard";
  }
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const nextPath = sanitizeNextPath(url.searchParams.get("next"));
  const loginUrl = new URL("/wealth/login", req.url);
  loginUrl.searchParams.set("next", nextPath);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!code || !supabaseUrl || !supabaseAnon) {
    loginUrl.searchParams.set("error", "magic");
    return NextResponse.redirect(loginUrl);
  }

  const sb = createClient(supabaseUrl, supabaseAnon, {
    auth: { persistSession: false },
  });

  const { data, error } = await sb.auth.exchangeCodeForSession(code);
  if (
    error ||
    !data.session?.access_token ||
    !data.session.refresh_token ||
    !data.user?.id
  ) {
    console.error("Wealth magic callback failed", error);
    loginUrl.searchParams.set("error", "magic");
    return NextResponse.redirect(loginUrl);
  }

  const profile = await fetchPortalProfile(data.user.id);
  if (!profile || profile.role !== "customer") {
    loginUrl.searchParams.set("error", "role");
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.redirect(new URL(nextPath, req.url));
  response.cookies.set(
    portalCookieNames.access,
    data.session.access_token,
    servicesCookieOptions(data.session.expires_in ?? 3600)
  );
  response.cookies.set(
    portalCookieNames.refresh,
    data.session.refresh_token,
    servicesCookieOptions(60 * 60 * 24 * 30)
  );
  return response;
}
