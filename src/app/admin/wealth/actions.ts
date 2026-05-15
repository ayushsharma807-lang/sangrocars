"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";
import { calculateUnits, normalizePhone, toNumber } from "@/lib/wealth";

const requireWealthAdmin = async () => {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect(`/admin/login?next=${encodeURIComponent("/admin/wealth")}`);
  }
  if (!auth.user?.id) {
    redirect(`/admin/login?next=${encodeURIComponent("/admin/wealth")}`);
  }
  return auth.user as { id: string; email?: string | null };
};

const logActivity = async ({
  actorProfileId,
  customerId,
  leadId,
  investmentId,
  activityType,
  message,
  metadata = {},
}: {
  actorProfileId?: string | null;
  customerId?: string | null;
  leadId?: string | null;
  investmentId?: string | null;
  activityType: string;
  message: string;
  metadata?: Record<string, unknown>;
}) => {
  const sb = supabaseServer();
  const { error } = await sb.from("wealth_activity_logs").insert({
    actor_profile_id: actorProfileId ?? null,
    customer_id: customerId ?? null,
    lead_id: leadId ?? null,
    investment_id: investmentId ?? null,
    activity_type: activityType,
    message,
    metadata,
  });
  if (error) console.error("Wealth activity log failed", error);
};

export async function updateWealthLeadAction(formData: FormData) {
  const user = await requireWealthAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "new");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const followUpDate = String(formData.get("follow_up_date") ?? "").trim() || null;

  if (!id) return;

  const sb = supabaseServer();
  const { error } = await sb
    .from("service_leads")
    .update({
      status,
      notes,
      follow_up_date: followUpDate,
    })
    .eq("id", id);

  if (error) {
    console.error("Wealth lead update failed", { id, error });
    redirect("/admin/wealth/leads?error=update_failed");
  }

  await logActivity({
    actorProfileId: user.id,
    leadId: id,
    activityType: "lead_status_changed",
    message: `Lead status updated to ${status}`,
    metadata: { status, notes, followUpDate },
  });

  revalidatePath("/admin/wealth");
  revalidatePath("/admin/wealth/leads");
}

export async function createWealthCustomerAction(formData: FormData) {
  const user = await requireWealthAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(formData.get("phone"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase() || null;
  const panPlaceholder = String(formData.get("pan_placeholder") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "active").toLowerCase();

  if (!name) {
    redirect("/admin/wealth/customers?error=missing_name");
  }

  const sb = supabaseServer();
  let profileId: string | null = null;
  if (email) {
    const { data: profile } = await sb
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    profileId = profile?.id ?? null;
  }

  const { data, error } = await sb
    .from("wealth_customers")
    .insert({
      profile_id: profileId,
      name,
      phone: phone || null,
      email,
      pan_placeholder: panPlaceholder,
      city,
      status: status === "inactive" ? "inactive" : "active",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("Wealth customer create failed", { error, name, email, phone });
    redirect("/admin/wealth/customers?error=create_failed");
  }

  await logActivity({
    actorProfileId: user.id,
    customerId: data.id,
    activityType: "customer_created",
    message: `Customer created: ${name}`,
    metadata: { name, email, phone, city },
  });

  revalidatePath("/admin/wealth");
  revalidatePath("/admin/wealth/customers");
  redirect("/admin/wealth/customers?created=1");
}

export async function createWealthInvestmentAction(formData: FormData) {
  const user = await requireWealthAdmin();
  const customerId = String(formData.get("customer_id") ?? "");
  const fundName = String(formData.get("fund_name") ?? "").trim();
  const schemeCode = String(formData.get("scheme_code") ?? "").trim() || null;
  const investmentDate = String(formData.get("investment_date") ?? "").trim() || new Date().toISOString().slice(0, 10);
  const amountInvested = toNumber(formData.get("amount_invested"));
  const navOnInvestmentDate = toNumber(formData.get("nav_on_investment_date"));
  const transactionType = String(formData.get("transaction_type") ?? "sip") === "lump_sum" ? "lump_sum" : "sip";
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const unitsBought = calculateUnits(amountInvested, navOnInvestmentDate);

  if (!customerId || !fundName || amountInvested <= 0 || navOnInvestmentDate <= 0) {
    redirect("/admin/wealth/investments?error=missing_fields");
  }

  const sb = supabaseServer();
  const { data, error } = await sb
    .from("wealth_investments")
    .insert({
      customer_id: customerId,
      fund_name: fundName,
      scheme_code: schemeCode,
      investment_date: investmentDate,
      amount_invested: amountInvested,
      nav_on_investment_date: navOnInvestmentDate,
      units_bought: unitsBought,
      transaction_type: transactionType,
      notes,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    console.error("Wealth investment create failed", { error, customerId, fundName });
    redirect("/admin/wealth/investments?error=create_failed");
  }

  await logActivity({
    actorProfileId: user.id,
    customerId,
    investmentId: data.id,
    activityType: "investment_added",
    message: `Investment added: ${fundName}`,
    metadata: { amountInvested, navOnInvestmentDate, unitsBought, transactionType },
  });

  revalidatePath("/admin/wealth");
  revalidatePath("/admin/wealth/investments");
  redirect("/admin/wealth/investments?created=1");
}
