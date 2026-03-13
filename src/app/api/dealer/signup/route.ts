import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { extractDealerCode, generateDealerCode, withDealerCode } from "@/lib/dealerCode";

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
  const { data: codeRows } = await sb.from("dealers").select("description").limit(5000);
  const usedCodes = new Set(
    ((codeRows ?? []) as { description?: string | null }[])
      .map((row) => extractDealerCode(row.description))
      .filter((value): value is string => Boolean(value))
  );
  const fallbackCode = generateDealerCode(name, usedCodes);

  const syncExistingDealer = async (dealerId: string) => {
    const existingDealer = await sb
      .from("dealers")
      .select("description")
      .eq("id", dealerId)
      .maybeSingle();
    const existingCode = extractDealerCode(existingDealer.data?.description);
    const finalDescription = withDealerCode(
      typeof existingDealer.data?.description === "string"
        ? existingDealer.data.description
        : null,
      existingCode ?? fallbackCode
    );
    const payloads: Record<string, unknown>[] = [
      {
        auth_user_id: userId,
        name,
        email,
        phone: phone || null,
        whatsapp: phone || null,
        address: city || null,
        city: city || null,
        description: finalDescription,
      },
      {
        auth_user_id: userId,
        name,
        email,
        phone: phone || null,
        whatsapp: phone || null,
        address: city || null,
        description: finalDescription,
      },
      {
        auth_user_id: userId,
        name,
        email,
        phone: phone || null,
        description: finalDescription,
      },
      {
        name,
        email,
        phone: phone || null,
        description: finalDescription,
      },
      {
        name,
        email,
        phone: phone || null,
      },
    ];

    for (const payload of payloads) {
      const { error } = await sb.from("dealers").update(payload).eq("id", dealerId);
      if (!error || isMissingSchema(error.message)) {
        return dealerId;
      }
    }

    return dealerId;
  };

  const existingDealerId = await findExistingDealerId(userId, email);
  if (existingDealerId) {
    return syncExistingDealer(existingDealerId);
  }

  const payloads: Record<string, unknown>[] = [
    {
      auth_user_id: userId,
      name,
      email,
      phone: phone || null,
      whatsapp: phone || null,
      address: city || null,
      description: withDealerCode(null, fallbackCode),
    },
    {
      name,
      email,
      phone: phone || null,
      whatsapp: phone || null,
      address: city || null,
      description: withDealerCode(null, fallbackCode),
    },
    {
      name,
      email,
      phone: phone || null,
      address: city || null,
      description: withDealerCode(null, fallbackCode),
    },
    {
      name,
      email,
      phone: phone || null,
      description: withDealerCode(null, fallbackCode),
    },
    {
      name,
      email,
      description: withDealerCode(null, fallbackCode),
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
      if (existingId) return syncExistingDealer(existingId);
    }

    if (error && !isMissingSchema(error.message) && !isDuplicate(error.message)) {
      continue;
    }
  }

  return null;
};

export async function POST(req: Request) {
  const form = await req.formData();
  const rawName = String(form.get("name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const city = String(form.get("city") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const nextPath = String(form.get("next") ?? "/dealer-admin/profile");
  const name =
    rawName ||
    (email.includes("@") ? email.split("@")[0]?.replace(/[._-]+/g, " ") : "") ||
    "Dealer";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!email || !password || password.length < 8) {
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

  const adminClient = supabaseServer();
  const { data: signUpData, error: createUserError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "dealer",
        roles: ["dealer"],
        dealer_name: name,
        city,
        phone,
      },
      app_metadata: {
        role: "dealer",
        roles: ["dealer"],
      },
    });

  if (createUserError || !signUpData?.user?.id) {
    const lowered = String(createUserError?.message ?? "").toLowerCase();
    const url = new URL("/dealer-admin/signup", req.url);
    url.searchParams.set(
      "error",
      lowered.includes("already") || lowered.includes("exists")
        ? "email_exists"
        : "signup_failed"
    );
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  }

  const userId = String(signUpData.user.id);

  const dealerId = await createDealerRecord({ userId, name, email, phone, city });
  if (!dealerId) {
    const url = new URL("/dealer-admin/signup", req.url);
    url.searchParams.set("error", "profile_setup");
    url.searchParams.set("next", nextPath);
    return NextResponse.redirect(url);
  }

  const loginRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnon,
    },
    body: JSON.stringify({ email, password }),
  });
  const loginData = loginRes.ok ? await loginRes.json().catch(() => ({})) : {};
  const accessToken = loginData?.access_token;
  const refreshToken = loginData?.refresh_token;
  const expiresIn = loginData?.expires_in ?? 3600;

  if (!accessToken || !refreshToken) {
    const url = new URL("/dealer-admin/login", req.url);
    url.searchParams.set("error", "1");
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
