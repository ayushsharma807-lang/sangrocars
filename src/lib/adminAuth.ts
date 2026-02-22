import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ALLOWED_EMAILS = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const REQUIRED_ROLES = (process.env.ADMIN_REQUIRED_ROLES ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

type SupabaseUser = {
  id?: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

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
  if (ALLOWED_EMAILS.length === 0) return true;
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
};

const isRoleAllowed = (user: SupabaseUser | null) => {
  if (REQUIRED_ROLES.length === 0) return true;
  const roles = extractRoles(user);
  return roles.some((role) => REQUIRED_ROLES.includes(role));
};

export const requireAdmin = async () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, error: "auth_not_configured" as const };
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  if (!accessToken) {
    return { ok: false, error: "unauthorized" as const };
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });

  if (!res.ok) {
    return { ok: false, error: "unauthorized" as const };
  }

  const user = (await res.json()) as SupabaseUser;
  if (!isEmailAllowed(user.email)) {
    return { ok: false, error: "forbidden_email" as const };
  }
  if (!isRoleAllowed(user)) {
    return { ok: false, error: "forbidden_role" as const };
  }

  return { ok: true, user };
};
