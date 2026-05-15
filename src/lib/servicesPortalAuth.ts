import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ACCESS_COOKIE = "services-access-token";
const REFRESH_COOKIE = "services-refresh-token";

export type ServicesRole = "admin" | "customer";

type AuthUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
};

export type PortalProfile = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  role: ServicesRole;
};

export const servicesCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "strict" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge,
});

const isEmail = (value: string) => value.includes("@");

const normalizePhone = (value?: string | null) => (value ?? "").replace(/\D/g, "");

export const resolveLoginEmail = async (identifier: string) => {
  const cleaned = identifier.trim();
  if (!cleaned) return null;
  if (isEmail(cleaned)) return cleaned.toLowerCase();

  const phone = normalizePhone(cleaned);
  if (!phone) return null;

  const sb = supabaseServer();
  const { data } = await sb
    .from("profiles")
    .select("email, phone")
    .or(`phone.eq.${phone},phone.eq.+91${phone},phone.ilike.%${phone}`)
    .limit(1)
    .maybeSingle();

  return data?.email?.toLowerCase() ?? null;
};

export const fetchAuthUser = async (accessToken: string): Promise<AuthUser | null> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as AuthUser;
  return payload?.id ? payload : null;
};

export const fetchPortalProfile = async (
  userId: string
): Promise<PortalProfile | null> => {
  const sb = supabaseServer();
  const { data } = await sb
    .from("profiles")
    .select("id, name, phone, email, role")
    .eq("id", userId)
    .maybeSingle();

  if (!data?.id || (data.role !== "admin" && data.role !== "customer")) {
    return null;
  }

  return data as PortalProfile;
};

export const getPortalSession = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  const authUser = await fetchAuthUser(accessToken);
  if (!authUser?.id) return null;

  const profile = await fetchPortalProfile(authUser.id);
  if (!profile) return null;

  return {
    accessToken,
    authUser,
    profile,
  };
};

export const requirePortalRole = async (
  role: ServicesRole,
  loginPath: string
) => {
  const session = await getPortalSession();
  if (!session || session.profile.role !== role) {
    redirect(`${loginPath}?error=unauthorized`);
  }
  return session;
};

export const hasPortalRole = async (role: ServicesRole) => {
  const session = await getPortalSession();
  if (!session || session.profile.role !== role) {
    return null;
  }
  return session;
};

export const portalCookieNames = {
  access: ACCESS_COOKIE,
  refresh: REFRESH_COOKIE,
};
