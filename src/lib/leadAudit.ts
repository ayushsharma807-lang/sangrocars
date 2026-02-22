import { supabaseServer } from "@/lib/supabase";

type AuditEntry = {
  lead_id: string | null;
  action: string;
  changes?: Record<string, unknown> | null;
  actor_email?: string | null;
  actor_id?: string | null;
};

const isMissingTable = (message?: string | null) => {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return (
    lowered.includes("does not exist") ||
    lowered.includes("relation") ||
    lowered.includes("unknown column") ||
    lowered.includes("column") ||
    lowered.includes("table")
  );
};

export const logLeadAudit = async (entry: AuditEntry) => {
  try {
    const sb = supabaseServer();
    const { error } = await sb.from("lead_audit").insert({
      lead_id: entry.lead_id,
      action: entry.action,
      changes: entry.changes ?? null,
      actor_email: entry.actor_email ?? null,
      actor_id: entry.actor_id ?? null,
    });
    if (error && !isMissingTable(error.message)) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
};
