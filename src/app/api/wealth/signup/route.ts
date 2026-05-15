import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: Request) {
  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").replace(/\D/g, "");
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const city = String(form.get("city") ?? "").trim() || null;
  const password = String(form.get("password") ?? "");

  if (!name || !phone || !email || password.length < 6) {
    return NextResponse.redirect(new URL("/wealth/signup?error=missing", req.url));
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
    console.error("Wealth signup auth create failed", error);
    return NextResponse.redirect(new URL("/wealth/signup?error=create", req.url));
  }

  const { error: profileError } = await sb.from("profiles").upsert({
    id: data.user.id,
    name,
    phone,
    email,
    role: "customer",
  });

  if (profileError) {
    console.error("Wealth signup profile failed", profileError);
    return NextResponse.redirect(new URL("/wealth/signup?error=profile", req.url));
  }

  const { data: existingCustomer } = await sb
    .from("wealth_customers")
    .select("id")
    .eq("profile_id", data.user.id)
    .maybeSingle();

  const customerPayload = {
      profile_id: data.user.id,
      name,
      phone,
      email,
      city,
      status: "active",
  };

  const { error: customerError } = existingCustomer?.id
    ? await sb.from("wealth_customers").update(customerPayload).eq("id", existingCustomer.id)
    : await sb.from("wealth_customers").insert(customerPayload);

  if (customerError) {
    console.error("Wealth signup customer failed", customerError);
    return NextResponse.redirect(new URL("/wealth/signup?error=customer", req.url));
  }

  return NextResponse.redirect(new URL("/wealth/login?registered=1", req.url));
}
