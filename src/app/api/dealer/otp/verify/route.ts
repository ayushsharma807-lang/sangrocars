import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { normalizePhoneForAuth, phoneVariants } from "@/lib/phone";

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

const sanitizeNextPath = (value: string) => {
  if (!value) return "/dealer-admin";
  if (value.startsWith("/dealer-admin")) return value;
  return "/dealer-admin";
};

const updateUserRoleMetadata = async (
  userId: string,
  phone: string,
  name: string,
  city: string
) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) return;

  await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
    },
    body: JSON.stringify({
      phone,
      phone_confirm: true,
      user_metadata: {
        role: "dealer",
        dealer_name: name || undefined,
        city: city || undefined,
        phone,
      },
      app_metadata: {
        role: "dealer",
        roles: ["dealer"],
      },
    }),
  }).catch(() => null);
};

const getDealerByAuthUser = async (userId: string) => {
  const sb = supabaseServer();
  const query = await sb
    .from("dealers")
    .select("id")
    .eq("auth_user_id", userId)
    .limit(1)
    .maybeSingle();
  if (!query.error && query.data?.id) return String(query.data.id);
  if (query.error && !isMissingSchema(query.error.message)) return null;
  return null;
};

const getDealerByPhone = async (phone: string) => {
  const sb = supabaseServer();
  const variants = phoneVariants(phone);
  for (const field of ["phone", "whatsapp"]) {
    for (const variant of variants) {
      const query = await sb
        .from("dealers")
        .select("id")
        .eq(field, variant)
        .limit(1)
        .maybeSingle();
      if (!query.error && query.data?.id) return String(query.data.id);
      if (query.error && !isMissingSchema(query.error.message)) {
        return null;
      }
    }
  }
  return null;
};

const createDealerRecord = async ({
  userId,
  name,
  phone,
  city,
}: {
  userId: string;
  name: string;
  phone: string;
  city: string;
}) => {
  const sb = supabaseServer();
  const payloads: Record<string, unknown>[] = [
    {
      auth_user_id: userId,
      name: name || "Dealer",
      phone: phone || null,
      whatsapp: phone || null,
      address: city || null,
    },
    {
      name: name || "Dealer",
      phone: phone || null,
      whatsapp: phone || null,
      address: city || null,
    },
    {
      name: name || "Dealer",
      phone: phone || null,
      whatsapp: phone || null,
    },
    {
      name: name || "Dealer",
      phone: phone || null,
    },
  ];

  for (const payload of payloads) {
    const created = await sb
      .from("dealers")
      .insert(payload)
      .select("id")
      .single();

    if (!created.error && created.data?.id) return String(created.data.id);

    if (created.error && isDuplicate(created.error.message)) {
      const existingId =
        (await getDealerByAuthUser(userId)) ?? (await getDealerByPhone(phone));
      if (existingId) return existingId;
    }

    if (created.error && !isMissingSchema(created.error.message) && !isDuplicate(created.error.message)) {
      continue;
    }
  }

  return null;
};

const ensureDealerUserMapping = async (dealerId: string, userId: string) => {
  const sb = supabaseServer();
  const inserted = await sb.from("dealer_users").insert({
    dealer_id: dealerId,
    user_id: userId,
    role: "owner",
  });
  if (!inserted.error || isDuplicate(inserted.error.message)) return;
};

export async function POST(req: Request) {
  const form = await req.formData();
  const modeRaw = String(form.get("mode") ?? "login").toLowerCase();
  const mode = modeRaw === "signup" ? "signup" : "login";
  const phone = normalizePhoneForAuth(String(form.get("phone") ?? ""));
  const token = String(form.get("token") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const city = String(form.get("city") ?? "").trim();
  const nextPath = sanitizeNextPath(String(form.get("next") ?? "/dealer-admin"));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const otpUrl = new URL("/dealer-admin/otp", req.url);
  otpUrl.searchParams.set("mode", mode);
  if (phone) otpUrl.searchParams.set("phone", phone);
  if (name) otpUrl.searchParams.set("name", name);
  if (city) otpUrl.searchParams.set("city", city);
  otpUrl.searchParams.set("next", nextPath);

  if (!phone || !token) {
    otpUrl.searchParams.set("error", "missing_fields");
    return NextResponse.redirect(otpUrl);
  }

  if (!supabaseUrl || !supabaseAnon) {
    otpUrl.searchParams.set("error", "config");
    return NextResponse.redirect(otpUrl);
  }

  const verifyResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnon,
    },
    body: JSON.stringify({
      type: "sms",
      phone,
      token,
    }),
  }).catch(() => null);

  if (!verifyResponse?.ok) {
    otpUrl.searchParams.set("error", "invalid_code");
    return NextResponse.redirect(otpUrl);
  }

  const payload = (await verifyResponse.json().catch(() => null)) as
    | {
        access_token?: string;
        refresh_token?: string;
        expires_in?: number;
        user?: { id?: string };
      }
    | null;
  const accessToken = payload?.access_token;
  const refreshToken = payload?.refresh_token;
  const expiresIn = payload?.expires_in ?? 3600;
  const userId = String(payload?.user?.id ?? "").trim();

  if (!accessToken || !refreshToken || !userId) {
    otpUrl.searchParams.set("error", "session_missing");
    return NextResponse.redirect(otpUrl);
  }

  await updateUserRoleMetadata(userId, phone, name, city);

  let dealerId =
    (await getDealerByAuthUser(userId)) ?? (await getDealerByPhone(phone));

  if (!dealerId && mode === "signup") {
    dealerId = await createDealerRecord({ userId, name, phone, city });
  }

  if (!dealerId) {
    otpUrl.searchParams.set("error", "dealer_not_found");
    return NextResponse.redirect(otpUrl);
  }

  await ensureDealerUserMapping(dealerId, userId);

  const response = NextResponse.redirect(new URL(nextPath, req.url));
  response.cookies.set("sb-access-token", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: expiresIn,
  });
  response.cookies.set("sb-refresh-token", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
