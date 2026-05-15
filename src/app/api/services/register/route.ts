import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: Request) {
  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const phone = String(form.get("phone") ?? "").trim();
  const password = String(form.get("password") ?? "");

  if (!name || !email || !password) {
    return NextResponse.redirect(
      new URL("/services-portal/register?error=missing", req.url)
    );
  }

  const sb = supabaseServer();
  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    phone: phone || undefined,
    user_metadata: {
      name,
      phone,
      role: "customer",
      roles: ["customer"],
    },
    app_metadata: {
      role: "customer",
      roles: ["customer"],
    },
  });

  if (error || !data.user?.id) {
    const url = new URL("/services-portal/register", req.url);
    url.searchParams.set("error", error?.message ? "exists" : "create");
    return NextResponse.redirect(url);
  }

  const { error: profileError } = await sb.from("profiles").upsert({
    id: data.user.id,
    name,
    email,
    phone,
    role: "customer",
  });

  if (profileError) {
    const url = new URL("/services-portal/register", req.url);
    url.searchParams.set("error", "profile");
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(
    new URL("/services-portal/login?registered=1", req.url)
  );
}
