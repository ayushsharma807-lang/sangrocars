"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";

const insuranceStatuses = new Set(["new", "contacted", "quote_sent", "converted", "lost", "rejected"]);

export async function updateInsuranceLeadAction(formData: FormData) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect(`/admin/login?next=${encodeURIComponent("/admin/insurance/leads")}`);
  }

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "new").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const followUpDate = String(formData.get("follow_up_date") ?? "").trim() || null;

  if (!id || !insuranceStatuses.has(status)) {
    redirect("/admin/insurance/leads?error=invalid");
  }

  const sb = supabaseServer();
  const { error } = await sb
    .from("service_leads")
    .update({ status, notes, follow_up_date: followUpDate })
    .eq("id", id)
    .eq("service_type", "insurance");

  if (error) {
    console.error("Insurance lead update failed", { id, status, error: error.message });
    redirect("/admin/insurance/leads?error=update_failed");
  }

  revalidatePath("/admin/insurance/leads");
}
