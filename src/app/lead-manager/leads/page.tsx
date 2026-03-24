import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";
import { requireLeadManager } from "@/lib/leadManagerAuth";
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  formatLeadStatus,
} from "@/lib/leadManagerTypes";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default async function LeadListPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; source?: string; status?: string }>;
}) {
  await requireLeadManager();
  const params = await searchParams;
  const search = (params.search ?? "").trim();
  const source = (params.source ?? "").trim();
  const status = (params.status ?? "").trim();

  const sb = supabaseServer();
  let query = sb
    .from("lead_manager_leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,phone.ilike.%${search}%,interested_car.ilike.%${search}%`
    );
  }
  if (source && LEAD_SOURCES.includes(source as never)) {
    query = query.eq("source", source);
  }
  if (status && LEAD_STATUSES.includes(status as never)) {
    query = query.eq("status", status);
  }

  const { data } = await query;
  const exportParams = new URLSearchParams();
  if (search) exportParams.set("search", search);
  if (source) exportParams.set("source", source);
  if (status) exportParams.set("status", status);
  const exportQuery = exportParams.toString();
  const exportSuffix = exportQuery ? `?${exportQuery}` : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Leads</h2>
          <p className="text-sm text-slate-600">Search, filter, and track every inquiry.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/api/lead-manager/leads/export${exportSuffix}`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Export CSV
          </Link>
          <Link
            href={`/api/lead-manager/leads/export-xlsx${exportSuffix}`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Export Excel
          </Link>
          <Link
            href="/lead-manager/new"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Add new lead
          </Link>
        </div>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <label className="text-sm text-slate-600">
          Search
          <input
            name="search"
            defaultValue={search}
            placeholder="Name, phone, or car"
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </label>
        <label className="text-sm text-slate-600">
          Source
          <select
            name="source"
            defaultValue={source}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
          >
            <option value="">All sources</option>
            {LEAD_SOURCES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Status
          <select
            name="status"
            defaultValue={status}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
          >
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((item) => (
              <option key={item} value={item}>
                {formatLeadStatus(item)}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
          <button
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            type="submit"
          >
            Apply filters
          </button>
          <Link className="text-sm text-slate-500" href="/lead-manager/leads">
            Clear
          </Link>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.16em] text-slate-400">
              <tr>
                <th className="py-2">Lead</th>
                <th className="py-2">Phone</th>
                <th className="py-2">City</th>
                <th className="py-2">Source</th>
                <th className="py-2">Status</th>
                <th className="py-2">Next follow-up</th>
                <th className="py-2">Created</th>
                <th className="py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              {(data ?? []).map((lead) => (
                <tr key={lead.id} className="border-t border-slate-100">
                  <td className="py-3 font-medium text-slate-900">
                    <Link className="hover:underline" href={`/lead-manager/leads/${lead.id}`}>
                      {lead.full_name}
                    </Link>
                  </td>
                  <td className="py-3">{lead.phone}</td>
                  <td className="py-3">{lead.city || "—"}</td>
                  <td className="py-3">{lead.source || "—"}</td>
                  <td className="py-3">{formatLeadStatus(lead.status)}</td>
                  <td className="py-3">{formatDate(lead.next_follow_up_date)}</td>
                  <td className="py-3">{formatDate(lead.created_at)}</td>
                  <td className="py-3">
                    <div className="flex justify-end gap-2">
                      <a
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                        href={`tel:${(lead.phone ?? "").replace(/\D/g, "")}`}
                      >
                        Call
                      </a>
                      <a
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                        href={`https://wa.me/${
                          ((lead.phone ?? "").replace(/\D/g, "").length === 10
                            ? `91${(lead.phone ?? "").replace(/\D/g, "")}`
                            : (lead.phone ?? "").replace(/\D/g, "")) || ""
                        }`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
              {(!data || data.length === 0) && (
                <tr>
                  <td className="py-6 text-sm text-slate-500" colSpan={8}>
                    No leads found.
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
