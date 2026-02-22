import { NextResponse } from "next/server";

const hasPlaceholder = (value?: string | null) => {
  if (!value) return true;
  const lowered = value.toLowerCase();
  return (
    lowered.includes("your_project_ref") ||
    lowered.includes("paste_") ||
    lowered.includes("your_anon_key") ||
    lowered.includes("xxxxxxxx") ||
    lowered.includes("example")
  );
};

const redirectToLogin = (req: Request, nextPath: string, error: string) => {
  const url = new URL("/admin/login", req.url);
  url.searchParams.set("error", error);
  url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url);
};

const sanitizeNextPath = (rawValue: string) => {
  const fallback = "/admin/leads";
  if (!rawValue) return fallback;

  let decoded = rawValue.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    // keep original value
  }

  let pathname = decoded;
  if (/^https?:\/\//i.test(decoded)) {
    try {
      pathname = new URL(decoded).pathname;
    } catch {
      return fallback;
    }
  }

  if (!pathname.startsWith("/")) {
    pathname = `/${pathname}`;
  }

  const allowedExact = new Set([
    "/admin",
    "/admin/",
    "/admin/leads",
    "/admin/exclusive-deals",
    "/admin/dealers",
    "/admin/listings",
    "/admin/listings/new",
  ]);
  if (allowedExact.has(pathname)) {
    return pathname === "/admin/" ? "/admin" : pathname;
  }
  if (pathname.startsWith("/admin/leads/")) {
    return pathname;
  }
  if (pathname.startsWith("/admin/exclusive-deals/")) {
    return pathname;
  }
  if (pathname.startsWith("/admin/dealers/")) {
    return pathname;
  }
  if (pathname.startsWith("/admin/listings/")) {
    return pathname;
  }

  return fallback;
};

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const nextPath = sanitizeNextPath(String(form.get("next") ?? "/admin/leads"));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const requiredRoles = (process.env.ADMIN_REQUIRED_ROLES ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (
    !supabaseUrl ||
    !supabaseAnon ||
    hasPlaceholder(supabaseUrl) ||
    hasPlaceholder(supabaseAnon)
  ) {
    return redirectToLogin(req, nextPath, "config");
  }

  let res: Response;
  try {
    res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnon,
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return redirectToLogin(req, nextPath, "config");
  }

  if (!res.ok) {
    return redirectToLogin(req, nextPath, "1");
  }

  const data = (await res.json().catch(() => null)) as
    | { access_token?: string; refresh_token?: string; expires_in?: number }
    | null;
  if (!data?.access_token || !data?.refresh_token) {
    return redirectToLogin(req, nextPath, "1");
  }
  if (allowedEmails.length > 0 || requiredRoles.length > 0) {
    let userRes: Response;
    try {
      userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
          apikey: supabaseAnon,
        },
      });
    } catch {
      return redirectToLogin(req, nextPath, "config");
    }
    if (!userRes.ok) {
      return redirectToLogin(req, nextPath, "1");
    }
    const user = (await userRes.json()) as {
      email?: string | null;
      app_metadata?: Record<string, unknown>;
      user_metadata?: Record<string, unknown>;
    };
    const userEmail = String(user?.email ?? "").toLowerCase();

    if (allowedEmails.length > 0 && !allowedEmails.includes(userEmail)) {
      return redirectToLogin(req, nextPath, "unauthorized");
    }

    if (requiredRoles.length > 0) {
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

      const allowed = roles.some((role) => requiredRoles.includes(role));
      if (!allowed) {
        return redirectToLogin(req, nextPath, "unauthorized_role");
      }
    }
  }

  const response = NextResponse.redirect(new URL(nextPath, req.url));
  response.cookies.set("sb-access-token", data.access_token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: data.expires_in ?? 3600,
  });
  response.cookies.set("sb-refresh-token", data.refresh_token, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function GET(req: Request) {
  return NextResponse.redirect(new URL("/admin/login", req.url));
}
