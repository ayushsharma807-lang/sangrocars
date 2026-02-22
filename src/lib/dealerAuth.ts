import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEALER_ALLOWED_EMAILS = (process.env.DEALER_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const DEALER_REQUIRED_ROLES = (process.env.DEALER_REQUIRED_ROLES ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

type SupabaseUser = {
  id?: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

type DealerRecord = {
  id: string;
  name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address?: string | null;
  description?: string | null;
  logo_url?: string | null;
  feed_url?: string | null;
  inventory_url?: string | null;
  sitemap_url?: string | null;
};

type DealerAuthError =
  | "auth_not_configured"
  | "unauthorized"
  | "forbidden_email"
  | "forbidden_role"
  | "dealer_not_found";

type DealerAuthResult =
  | { ok: false; error: DealerAuthError }
  | { ok: true; user: SupabaseUser; dealer: DealerRecord };

const extractRoles = (user: SupabaseUser | null) => {
  const roles: string[] = [];
  const addRole = (role: unknown) => {
    if (!role) return;
    if (Array.isArray(role)) {
      role.forEach((entry) => addRole(entry));
      return;
    }
    if (typeof role === "string") {
      roles.push(role.toLowerCase());
    }
  };

  addRole(user?.app_metadata?.roles);
  addRole(user?.app_metadata?.role);
  addRole(user?.user_metadata?.roles);
  addRole(user?.user_metadata?.role);
  return roles;
};

const isEmailAllowed = (email?: string | null) => {
  if (DEALER_ALLOWED_EMAILS.length === 0) return true;
  if (!email) return false;
  return DEALER_ALLOWED_EMAILS.includes(email.toLowerCase());
};

const isRoleAllowed = (user: SupabaseUser | null) => {
  if (DEALER_REQUIRED_ROLES.length === 0) return true;
  const roles = extractRoles(user);
  return roles.some((role) => DEALER_REQUIRED_ROLES.includes(role));
};

const isMissingSchema = (message?: string | null) => {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return (
    lowered.includes("does not exist") ||
    lowered.includes("column") ||
    lowered.includes("could not find the table") ||
    lowered.includes("schema cache") ||
    lowered.includes("relation") ||
    lowered.includes("unknown")
  );
};

const fetchSupabaseUser = async (accessToken: string) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) return null;
  return (await res.json()) as SupabaseUser;
};

const getDealerById = async (dealerId: string) => {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("dealers")
    .select("*")
    .eq("id", dealerId)
    .single();
  if (error) return null;
  return data as DealerRecord;
};

const findDealerForUser = async (user: SupabaseUser) => {
  const sb = supabaseServer();
  const userId = user.id ?? "";
  const userEmail = user.email ?? "";

  const metadataDealerId =
    (user.user_metadata?.dealer_id as string | undefined) ??
    (user.app_metadata?.dealer_id as string | undefined);
  if (metadataDealerId) {
    const dealer = await getDealerById(metadataDealerId);
    if (dealer) return dealer;
  }

  if (userId) {
    const byAuth = await sb
      .from("dealers")
      .select("*")
      .eq("auth_user_id", userId)
      .single();
    if (!byAuth.error && byAuth.data) {
      return byAuth.data as DealerRecord;
    }
    if (byAuth.error && !isMissingSchema(byAuth.error.message)) {
      // Non-schema error, continue fallback.
    }

    const mapping = await sb
      .from("dealer_users")
      .select("dealer_id")
      .eq("user_id", userId)
      .single();
    if (!mapping.error && mapping.data?.dealer_id) {
      const dealer = await getDealerById(String(mapping.data.dealer_id));
      if (dealer) return dealer;
    }
  }

  if (userEmail) {
    for (const column of ["email", "owner_email", "contact_email"]) {
      const result = await sb
        .from("dealers")
        .select("*")
        .eq(column, userEmail)
        .single();
      if (!result.error && result.data) {
        return result.data as DealerRecord;
      }
      if (result.error && !isMissingSchema(result.error.message)) {
        // ignore and continue
      }
    }
  }

  return null;
};

export const requireDealer = async (): Promise<DealerAuthResult> => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, error: "auth_not_configured" as const };
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  if (!accessToken) {
    return { ok: false, error: "unauthorized" as const };
  }

  const user = await fetchSupabaseUser(accessToken);
  if (!user) {
    return { ok: false, error: "unauthorized" as const };
  }
  if (!isEmailAllowed(user.email)) {
    return { ok: false, error: "forbidden_email" as const };
  }
  if (!isRoleAllowed(user)) {
    return { ok: false, error: "forbidden_role" as const };
  }

  const dealer = await findDealerForUser(user);
  if (!dealer) {
    return { ok: false, error: "dealer_not_found" as const };
  }

  return { ok: true, user, dealer };
};
