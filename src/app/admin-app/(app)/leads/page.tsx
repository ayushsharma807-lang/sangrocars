import { requireAdminApp } from "@/lib/adminAppGuard";
import { supabaseServer } from "@/lib/supabase";
import LeadRowActions from "@/app/admin-app/components/LeadRowActions";

const STATUS_OPTIONS = ["new", "contacted", "follow_up", "closed"];

export default async function AdminAppLeads({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  await requireAdminApp();
  const params = await searchParams;
  const search = (params.search ?? "").trim();
  const status = (params.status ?? "").trim();

  const sb = supabaseServer();
  let query = sb
    .from("leads")
    .select("id, name, phone, listing_title, source, status, notes, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,phone.ilike.%${search}%,listing_title.ilike.%${search}%`
    );
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Leads</h2>
        <p className="text-sm text-slate-600">Track every incoming inquiry.</p>
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <label className="text-sm text-slate-600">
          Search
          <input
            name="search"
            defaultValue={search}
            placeholder="Name, phone, or car"
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
          />
        </label>
        <label className="text-sm text-slate-600">
          Status
          <select
            name="status"
            defaultValue={status}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Apply
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {(data ?? []).map((lead) => (
          <div
            key={lead.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {lead.name}
                </p>
                <p className="text-sm text-slate-600">{lead.phone}</p>
                <p className="text-xs text-slate-500">
                  {lead.listing_title || "No listing"} · {lead.source || "Direct"}
                </p>
              </div>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
                {lead.status}
              </span>
            </div>
            <LeadRowActions lead={lead} />
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No leads found.
          </div>
        )}
      </div>
    </div>
  );
}
