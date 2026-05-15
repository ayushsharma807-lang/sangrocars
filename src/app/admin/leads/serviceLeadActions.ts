"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";

const VALID_STATUSES = new Set([
  "new",
  "contacted",
  "in_progress",
  "completed",
  "rejected",
]);

export async function updateServiceLeadStatus(formData: FormData) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect("/admin/login?error=unauthorized");
  }

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();

  if (!id || !VALID_STATUSES.has(status)) {
    redirect("/admin/leads?serviceLeadError=invalid");
  }

  const sb = supabaseServer();
  const { error } = await sb.from("service_leads").update({ status }).eq("id", id);

  if (error) {
    console.error("Service lead status update failed", { id, status, error: error.message });
    redirect("/admin/leads?serviceLeadError=update_failed");
  }

  revalidatePath("/admin/leads");
}
