import { NextResponse } from "next/server";
import { getPortalSession } from "@/lib/servicesPortalAuth";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await getPortalSession();
  if (!session || session.profile.role !== "customer") {
    return NextResponse.redirect(
      new URL("/services-portal/login?error=unauthorized", req.url)
    );
  }

  const form = await req.formData();
  const type = String(form.get("type") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();
  const amountRaw = String(form.get("amount") ?? "").trim();
  const amount = amountRaw ? Number(amountRaw) : null;

  const validTypes = new Set([
    "invest",
    "withdraw",
    "sip_start",
    "sip_stop",
    "sip_change",
  ]);

  if (!validTypes.has(type)) {
    return NextResponse.redirect(
      new URL("/services-portal?error=request_type", req.url)
    );
  }

  const sb = supabaseServer();
  const { error } = await sb.from("service_requests").insert({
    customer_id: session.profile.id,
    request_type: type,
    message: message || null,
    amount,
    status: "pending",
  });

  const redirectUrl = new URL("/services-portal", req.url);
  redirectUrl.searchParams.set(error ? "error" : "success", error ? "request" : "request");
  return NextResponse.redirect(redirectUrl);
}
