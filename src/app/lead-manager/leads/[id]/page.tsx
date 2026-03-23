import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { requireLeadManager } from "@/lib/leadManagerAuth";
import { formatLeadStatus } from "@/lib/leadManagerTypes";
import LeadDetailClient from "@/app/lead-manager/leads/[id]/LeadDetailClient";

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireLeadManager();
  const { id } = await params;
  const sb = supabaseServer();
  const { data } = await sb
    .from("lead_manager_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Lead detail</p>
          <h2 className="text-2xl font-semibold text-slate-900">{data.full_name}</h2>
          <p className="text-sm text-slate-600">{formatLeadStatus(data.status)}</p>
        </div>
        <Link className="text-sm text-slate-500" href="/lead-manager/leads">
          Back to leads
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Lead info</h3>
          <div className="mt-4 grid gap-4 text-sm text-slate-700">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Phone</p>
              <p className="mt-1 font-medium text-slate-900">{data.phone}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">City</p>
              <p className="mt-1">{data.city || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Budget</p>
              <p className="mt-1">{data.budget || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Interested car</p>
              <p className="mt-1">{data.interested_car || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Source</p>
              <p className="mt-1">{data.source || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Cash or finance</p>
              <p className="mt-1">{data.cash_or_finance || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Created</p>
              <p className="mt-1">{formatDateTime(data.created_at)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Updated</p>
              <p className="mt-1">{formatDateTime(data.updated_at)}</p>
            </div>
          </div>
        </div>

        <LeadDetailClient
          id={data.id}
          initialStatus={data.status}
          initialNotes={data.notes}
          initialFollowUp={data.next_follow_up_date}
          initialAssigned={data.assigned_to}
        />
      </div>
    </div>
  );
}
