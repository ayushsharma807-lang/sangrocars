import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

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

const isDuplicate = (message?: string | null) => {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return lowered.includes("duplicate") || lowered.includes("unique");
};

const findExistingDealerId = async (userId: string, email: string) => {
  const sb = supabaseServer();

  const byAuth = await sb
    .from("dealers")
    .select("id")
    .eq("auth_user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!byAuth.error && byAuth.data?.id) return String(byAuth.data.id);

  if (byAuth.error && !isMissingSchema(byAuth.error.message)) {
    return null;
  }

  const byEmail = await sb
    .from("dealers")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();
  if (!byEmail.error && byEmail.data?.id) return String(byEmail.data.id);

  return null;
};

const createDealerRecord = async ({
  userId,
  name,
  email,
  phone,
  city,
}: {
  userId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
}) => {
  const sb = supabaseServer();
  const payloads: Record<string, unknown>[] = [
    {
      auth_user_id: userId,
      name,
      email,
      phone: phone || null,
      whatsapp: phone || null,
      address: city || null,
    },
    {
      name,
      email,
      phone: phone || null,
      whatsapp: phone || null,
      address: city || null,
    },
    {
      name,
      email,
      phone: phone || null,
      address: city || null,
    },
    {
      name,
      email,
      phone: phone || null,
    },
    {
      name,
      email,
    },
  ];

  for (const payload of payloads) {
    const { data, error } = await sb
      .from("dealers")
      .insert(payload)
      .select("id")
      .single();

    if (!error && data?.id) return String(data.id);

    if (error && isDuplicate(error.message)) {
      const existingId = await findExistingDealerId(userId, email);
      if (existingId) return existingId;
    }

    if (error && !isMissingSchema(error.message) && !isDuplicate(error.message)) {
      continue;
    }
  }

  return null;
};

export async function POST(req: Request) {
  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const city = String(form.get("city") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const nextPath = String(form.get("next") ?? "/dealer-admin/profile");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!name || !email || !password || password.length < 8) {
    const url = new URL("/dealer-admin/signup", req.url);
    url.searchParams.set("error", "invalid_input");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  }

  if (!supabaseUrl || !supabaseAnon || !serviceRole) {
    const url = new URL("/dealer-admin/signup", req.url);
    url.searchParams.set("error", "config");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  }

  const signUpRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnon,
    },
    body: JSON.stringify({
      email,
      password,
      data: {
        role: "dealer",
        dealer_name: name,
        city,
        phone,
      },
    }),
  });

  const signUpData = await signUpRes.json().catch(() => ({}));
  if (!signUpRes.ok || signUpData?.error) {
    const url = new URL("/dealer-admin/signup", req.url);
    url.searchParams.set("error", "signup_failed");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  }

  const userId = String(
    signUpData?.user?.id ?? signUpData?.session?.user?.id ?? ""
  );
  if (!userId) {
    const url = new URL("/dealer-admin/login", req.url);
    url.searchParams.set("signup", "check_email");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  }

  const dealerId = await createDealerRecord({ userId, name, email, phone, city });
  if (!dealerId) {
    const url = new URL("/dealer-admin/signup", req.url);
    url.searchParams.set("error", "profile_setup");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  }

  const accessToken = signUpData?.access_token ?? signUpData?.session?.access_token;
  const refreshToken = signUpData?.refresh_token ?? signUpData?.session?.refresh_token;
  const expiresIn = signUpData?.expires_in ?? signUpData?.session?.expires_in ?? 3600;

  if (!accessToken || !refreshToken) {
    const url = new URL("/dealer-admin/login", req.url);
    url.searchParams.set("signup", "check_email");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  }

  const destination = new URL(nextPath, req.url);
  destination.searchParams.set("signup", "success");
  const response = NextResponse.redirect(destination);

  response.cookies.set("sb-access-token", String(accessToken), {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: Number(expiresIn),
  });
  response.cookies.set("sb-refresh-token", String(refreshToken), {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

