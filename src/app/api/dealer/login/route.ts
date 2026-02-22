import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const nextPath = String(form.get("next") ?? "/dealer-admin");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const allowedEmails = (process.env.DEALER_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const requiredRoles = (process.env.DEALER_REQUIRED_ROLES ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (!supabaseUrl || !supabaseAnon) {
    const url = new URL("/dealer-admin/login", req.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  }

  const res = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnon,
      },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!res.ok) {
    const url = new URL("/dealer-admin/login", req.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  }

  const data = await res.json();
  if (allowedEmails.length > 0 || requiredRoles.length > 0) {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        apikey: supabaseAnon,
      },
    });
    if (!userRes.ok) {
      const url = new URL("/dealer-admin/login", req.url);
      url.searchParams.set("error", "1");
      url.searchParams.set("next", nextPath);
      return NextResponse.redirect(url);
    }
    const user = (await userRes.json()) as {
      email?: string | null;
      app_metadata?: Record<string, unknown>;
      user_metadata?: Record<string, unknown>;
    };
    const userEmail = String(user?.email ?? "").toLowerCase();

    if (allowedEmails.length > 0 && !allowedEmails.includes(userEmail)) {
      const url = new URL("/dealer-admin/login", req.url);
      url.searchParams.set("error", "unauthorized");
      url.searchParams.set("next", nextPath);
      return NextResponse.redirect(url);
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
        const url = new URL("/dealer-admin/login", req.url);
        url.searchParams.set("error", "unauthorized_role");
        url.searchParams.set("next", nextPath);
        return NextResponse.redirect(url);
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
