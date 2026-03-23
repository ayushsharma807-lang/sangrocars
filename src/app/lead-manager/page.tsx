import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";
import { requireLeadManager } from "@/lib/leadManagerAuth";
import { formatLeadStatus } from "@/lib/leadManagerTypes";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default async function LeadManagerDashboard() {
  await requireLeadManager();
  const sb = supabaseServer();

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  const [total, newLeads, followUps, closedLeads, recent] = await Promise.all([
    sb.from("lead_manager_leads").select("id", { count: "exact", head: true }),
    sb
      .from("lead_manager_leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "new"),
    sb
      .from("lead_manager_leads")
      .select("id", { count: "exact", head: true })
      .lte("next_follow_up_date", todayIso)
      .neq("status", "closed")
      .neq("status", "lost"),
    sb
      .from("lead_manager_leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "closed"),
    sb
      .from("lead_manager_leads")
      .select("id, full_name, phone, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const statCard = (label: string, value: number | null | undefined) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">
        {value ?? 0}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
          <p className="text-sm text-slate-600">
            Track daily lead progress and follow-ups.
          </p>
        </div>
        <Link
          href="/lead-manager/new"
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Add new lead
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCard("Total leads", total.count)}
        {statCard("New leads", newLeads.count)}
        {statCard("Follow-ups due", followUps.count)}
        {statCard("Closed", closedLeads.count)}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Recent leads</h3>
          <Link className="text-sm text-slate-600" href="/lead-manager/leads">
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="py-2">Lead</th>
                <th className="py-2">Phone</th>
                <th className="py-2">Source</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {(recent.data ?? []).map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100">
                  <td className="py-3 font-medium text-slate-900">
                    {lead.full_name}
                  </td>
                  <td className="py-3">{lead.phone}</td>
                  <td className="py-3">{lead.source || "—"}</td>
                  <td className="py-3">{formatLeadStatus(lead.status)}</td>
                  <td className="py-3">{formatDate(lead.created_at)}</td>
                </tr>
              ))}
              {(!recent.data || recent.data.length === 0) && (
                <tr>
                  <td className="py-6 text-sm text-slate-500" colSpan={5}>
                    No leads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
