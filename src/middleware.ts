import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_ALLOWED_EMAILS = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_REQUIRED_ROLES = (process.env.ADMIN_REQUIRED_ROLES ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const DEALER_ALLOWED_EMAILS = (process.env.DEALER_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);
const DEALER_REQUIRED_ROLES = (process.env.DEALER_REQUIRED_ROLES ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

type SupabaseUser = {
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

const isEmailAllowed = (email?: string | null, allowedList?: string[]) => {
  if (!allowedList || allowedList.length === 0) return true;
  if (!email) return false;
  return allowedList.includes(email.toLowerCase());
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

const isRoleAllowed = (user: SupabaseUser | null, requiredRoles: string[]) => {
  if (requiredRoles.length === 0) return true;
  const roles = extractRoles(user);
  return roles.some((role) => requiredRoles.includes(role));
};

const redirectWithError = (
  req: NextRequest,
  loginPath: string,
  pathname: string,
  error?: string
) => {
  const url = req.nextUrl.clone();
  url.pathname = loginPath;
  url.searchParams.set("next", pathname);
  if (error) url.searchParams.set("error", error);
  const response = NextResponse.redirect(url);
  response.cookies.set("sb-access-token", "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
  });
  response.cookies.set("sb-refresh-token", "", {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
  });
  return response;
};

const getSupabaseUser = async (accessToken: string) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) return null;
  return res.json();
};

const refreshSession = async (refreshToken: string) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const res = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }
  );
  if (!res.ok) return null;
  return res.json();
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const loginPath = isAdminRoute ? "/admin/login" : "/dealer-admin/login";

  if (
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/dealer-admin/login") ||
    pathname.startsWith("/dealer-admin/signup") ||
    pathname.startsWith("/dealer-admin/otp")
  ) {
    return NextResponse.next();
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  const allowedEmails = isAdminRoute ? ADMIN_ALLOWED_EMAILS : DEALER_ALLOWED_EMAILS;
  const requiredRoles = isAdminRoute ? ADMIN_REQUIRED_ROLES : DEALER_REQUIRED_ROLES;
  const errorCode = isAdminRoute ? "unauthorized_role" : "unauthorized_role";

  const accessToken = req.cookies.get("sb-access-token")?.value;
  const refreshToken = req.cookies.get("sb-refresh-token")?.value;

  if (accessToken) {
    const user = await getSupabaseUser(accessToken);
    if (
      user &&
      isEmailAllowed(user?.email, allowedEmails) &&
      isRoleAllowed(user, requiredRoles)
    ) {
      return NextResponse.next();
    }

    if (
      user &&
      (!isEmailAllowed(user?.email, allowedEmails) ||
        !isRoleAllowed(user, requiredRoles))
    ) {
      const error = !isEmailAllowed(user?.email, allowedEmails)
        ? "unauthorized"
        : errorCode;
      return redirectWithError(req, loginPath, pathname, error);
    }
  }

  if (refreshToken) {
    const refreshed = await refreshSession(refreshToken);
    if (refreshed?.access_token) {
      const user = await getSupabaseUser(refreshed.access_token);
      if (
        !user ||
        !isEmailAllowed(user?.email, allowedEmails) ||
        !isRoleAllowed(user, requiredRoles)
      ) {
        const error = !user
          ? undefined
          : !isEmailAllowed(user?.email, allowedEmails)
            ? "unauthorized"
            : errorCode;
        return redirectWithError(req, loginPath, pathname, error);
      }

      const response = NextResponse.next();
      response.cookies.set("sb-access-token", refreshed.access_token, {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: refreshed.expires_in ?? 3600,
      });
      if (refreshed.refresh_token) {
        response.cookies.set("sb-refresh-token", refreshed.refresh_token, {
          httpOnly: true,
          sameSite: "strict",
          path: "/",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 30,
        });
      }
      return response;
    }
  }

  const url = req.nextUrl.clone();
  url.pathname = loginPath;
  url.searchParams.set("next", pathname);
  if (allowedEmails.length > 0) {
    url.searchParams.set("error", "unauthorized");
  }
  if (requiredRoles.length > 0) {
    url.searchParams.set("error", errorCode);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/dealer-admin/:path*"],
};
