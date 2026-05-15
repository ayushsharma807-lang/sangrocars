import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";
import { enrichInvestmentsWithNav, formatInr, type WealthInvestment } from "@/lib/wealth";

export const dynamic = "force-dynamic";

const statCard = (label: string, value: string, caption: string, href: string) => (
  <Link
    href={href}
    className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-emerald-300"
  >
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
    <p className="mt-2 text-sm text-slate-500">{caption}</p>
  </Link>
);

export default async function WealthAdminPage() {
  const sb = supabaseServer();

  const [
    leadsResult,
    customersResult,
    investmentsResult,
    activityResult,
  ] = await Promise.all([
    sb
      .from("service_leads")
      .select("id,name,phone,email,investment_goal,monthly_sip_amount,status,created_at")
      .eq("service_type", "mutual_funds")
      .order("created_at", { ascending: false })
      .limit(5),
    sb
      .from("wealth_customers")
      .select("id,name,phone,email,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    sb
      .from("wealth_investments")
      .select("id,customer_id,fund_name,scheme_code,investment_date,amount_invested,nav_on_investment_date,units_bought,transaction_type,notes,created_at,wealth_customers(id,name,phone,email)")
      .order("created_at", { ascending: false })
      .limit(12),
    sb
      .from("wealth_activity_logs")
      .select("id,activity_type,message,created_at")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const leads = leadsResult.data ?? [];
  const customers = customersResult.data ?? [];
  const investments = await enrichInvestmentsWithNav(
    ((investmentsResult.data ?? []) as unknown as WealthInvestment[])
  );
  const activity = activityResult.data ?? [];
  const totalInvested = investments.reduce((sum, row) => sum + row.amount_invested, 0);
  const currentValue = investments.reduce((sum, row) => sum + row.currentValue, 0);
  const pendingLeads = leads.filter((lead) => lead.status === "new").length;

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Wealth command center
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Mutual funds backend
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Manage early access leads, investor profiles, manual investments, NAV-linked value,
            and follow-ups from one clean admin view.
          </p>
        </div>
        <Link
          href="/admin/wealth/investments"
          className="rounded-full bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
        >
          Add investment
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCard("New leads", String(pendingLeads), "Mutual fund enquiries waiting", "/admin/wealth/leads")}
        {statCard("Customers", String(customers.length), "Recent investor records", "/admin/wealth/customers")}
        {statCard("Invested", formatInr(totalInvested), "Manual investment book", "/admin/wealth/investments")}
        {statCard("Current value", formatInr(currentValue), "Calculated from latest NAV", "/admin/wealth/investments")}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">Recent investments</h2>
              <p className="text-sm text-slate-500">Live value uses latest daily NAV.</p>
            </div>
            <Link className="text-sm font-semibold text-emerald-700" href="/admin/wealth/investments">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {investments.slice(0, 5).map((row) => (
              <div key={row.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <p className="font-semibold text-slate-950">{row.fund_name}</p>
                    <p className="text-sm text-slate-500">
                      {row.wealth_customers?.name ?? "Customer"} · {row.transaction_type === "sip" ? "SIP" : "Lump Sum"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-semibold">{formatInr(row.currentValue)}</p>
                    <p className={row.profitLoss >= 0 ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
                      {row.profitLoss >= 0 ? "+" : ""}{formatInr(row.profitLoss)} ({row.returnPercent}%)
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {investments.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                No investments yet. Add the first manual entry from Investments.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Latest leads</h2>
              <Link className="text-sm font-semibold text-emerald-700" href="/admin/wealth/leads">
                Manage
              </Link>
            </div>
            <div className="space-y-3">
              {leads.map((lead) => (
                <div key={lead.id} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold">{lead.name}</p>
                  <p className="text-sm text-slate-500">
                    {lead.phone} · {lead.investment_goal ?? "Goal not set"}
                  </p>
                  <span className="mt-3 inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold capitalize">
                    {String(lead.status).replaceAll("_", " ")}
                  </span>
                </div>
              ))}
              {leads.length === 0 && <p className="text-sm text-slate-500">No mutual fund leads yet.</p>}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-semibold">Activity</h2>
            <div className="mt-4 space-y-3">
              {activity.map((item) => (
                <div key={item.id} className="border-l-2 border-emerald-200 pl-4">
                  <p className="text-sm font-semibold">{item.message}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(item.created_at).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
              {activity.length === 0 && <p className="text-sm text-slate-500">No activity yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
