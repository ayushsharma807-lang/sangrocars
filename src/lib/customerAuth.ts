import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type SupabaseUser = {
  id?: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

type CustomerProfile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  preferred_language?: string | null;
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

const fetchSupabaseUser = async (accessToken?: string | null) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !accessToken) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  }).catch(() => null);

  if (!response?.ok) return null;
  return (await response.json().catch(() => null)) as SupabaseUser | null;
};

const ensureCustomerProfile = async (user: SupabaseUser) => {
  const userId = String(user.id ?? "").trim();
  if (!userId) return null;
  const sb = supabaseServer();
  const fullName =
    String(user.user_metadata?.full_name ?? "").trim() ||
    String(user.user_metadata?.name ?? "").trim() ||
    null;
  const preferredLanguage =
    String(user.user_metadata?.preferred_language ?? "").trim() || null;
  const phone = String(user.user_metadata?.phone ?? "").trim() || null;
  const city = String(user.user_metadata?.city ?? "").trim() || null;
  const email = String(user.email ?? "").trim() || null;

  const upsert = await sb
    .from("customer_profiles")
    .upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        phone,
        city,
        preferred_language: preferredLanguage,
      },
      { onConflict: "id" }
    )
    .select("*")
    .maybeSingle();

  if (!upsert.error && upsert.data) {
    return upsert.data as CustomerProfile;
  }

  if (upsert.error && !isMissingSchema(upsert.error.message)) {
    return null;
  }

  const fallback = await sb
    .from("customer_profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (!fallback.error && fallback.data) {
    return fallback.data as CustomerProfile;
  }

  return null;
};

export const getOptionalCustomer = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  const user = await fetchSupabaseUser(accessToken);
  if (!user?.id) {
    return { ok: false as const };
  }
  const profile = await ensureCustomerProfile(user);
  return { ok: true as const, user, profile };
};

export const requireCustomer = async () => {
  const optional = await getOptionalCustomer();
  if (!optional.ok) {
    return { ok: false as const, error: "unauthorized" as const };
  }
  return {
    ok: true as const,
    user: optional.user,
    profile: optional.profile,
  };
};
