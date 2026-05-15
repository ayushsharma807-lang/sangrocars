"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";

const financeStatuses = new Set(["new", "contacted", "in_progress", "completed", "rejected", "converted", "lost"]);

export async function updateFinanceLeadAction(formData: FormData) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect(`/admin/login?next=${encodeURIComponent("/admin/finance/leads")}`);
  }

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "new").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const followUpDate = String(formData.get("follow_up_date") ?? "").trim() || null;

  if (!id || !financeStatuses.has(status)) {
    redirect("/admin/finance/leads?error=invalid");
  }

  const sb = supabaseServer();
  const { error } = await sb
    .from("service_leads")
    .update({ status, notes, follow_up_date: followUpDate })
    .eq("id", id)
    .eq("service_type", "finance");

  if (error) {
    console.error("Finance lead update failed", { id, status, error: error.message });
    redirect("/admin/finance/leads?error=update_failed");
  }

  revalidatePath("/admin/finance/leads");
}
