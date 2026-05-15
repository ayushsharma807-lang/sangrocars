import { supabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function WealthActivityPage() {
  const sb = supabaseServer();
  const { data: logs, error } = await sb
    .from("wealth_activity_logs")
    .select("id,activity_type,message,metadata,created_at,wealth_customers(name),service_leads(name),wealth_investments(fund_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Audit trail</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Wealth activity</h1>
        <p className="mt-2 text-slate-600">Follow every important action in the mutual funds workflow.</p>
      </div>
      {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</div>}
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
        <div className="space-y-5">
          {(logs ?? []).map((log) => (
            <div key={log.id} className="relative border-l-2 border-emerald-200 pb-5 pl-5 last:pb-0">
              <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-emerald-600" />
              <div className="flex flex-col justify-between gap-2 sm:flex-row">
                <div>
                  <p className="font-semibold">{log.message}</p>
                  <p className="mt-1 text-sm text-slate-500">{log.activity_type.replaceAll("_", " ")}</p>
                </div>
                <p className="text-sm text-slate-500">{new Date(log.created_at).toLocaleString("en-IN")}</p>
              </div>
            </div>
          ))}
          {(logs ?? []).length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No activity logs yet.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
