import { supabaseServer } from "@/lib/supabase";
import {
  enrichInvestmentsWithNav,
  formatInr,
  formatNumber,
  type WealthInvestment,
} from "@/lib/wealth";
import { createWealthInvestmentAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function WealthInvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sb = supabaseServer();
  const [customersResult, investmentsResult] = await Promise.all([
    sb
      .from("wealth_customers")
      .select("id,name,phone,email,status")
      .order("name", { ascending: true }),
    sb
      .from("wealth_investments")
      .select("id,customer_id,fund_name,scheme_code,investment_date,amount_invested,nav_on_investment_date,units_bought,transaction_type,notes,created_at,wealth_customers(id,name,phone,email)")
      .order("investment_date", { ascending: false }),
  ]);

  const customers = customersResult.data ?? [];
  const investments = await enrichInvestmentsWithNav(
    ((investmentsResult.data ?? []) as unknown as WealthInvestment[])
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Investment book</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Mutual fund investments</h1>
        <p className="mt-2 text-slate-600">Manual entries now, latest NAV calculation automatically when scheme code is present.</p>
      </div>

      {params.created && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Investment added.</div>}
      {params.error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Could not save investment. Check required fields.</div>}

      <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <form action={createWealthInvestmentAction} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-semibold">Add investment</h2>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-semibold">
              Customer
              <select name="customer_id" required className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone ? `(${customer.phone})` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              Fund name
              <input name="fund_name" required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Parag Parikh Flexi Cap" />
            </label>
            <label className="text-sm font-semibold">
              Scheme code
              <input name="scheme_code" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="122639" />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Investment date
                <input name="investment_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" />
              </label>
              <label className="text-sm font-semibold">
                Type
                <select name="transaction_type" className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">
                  <option value="sip">SIP</option>
                  <option value="lump_sum">Lump Sum</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Amount invested
                <input name="amount_invested" required inputMode="decimal" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="10000" />
              </label>
              <label className="text-sm font-semibold">
                NAV on investment date
                <input name="nav_on_investment_date" required inputMode="decimal" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="72.45" />
              </label>
            </div>
            <label className="text-sm font-semibold">
              Notes
              <textarea name="notes" rows={3} className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Folio, platform, SIP instruction, document notes..." />
            </label>
          </div>
          <button className="mt-5 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" type="submit">
            Save investment
          </button>
        </form>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-semibold">Live value tracker</h2>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                <tr>
                  <th className="py-3">Customer / Fund</th>
                  <th className="py-3">Invested</th>
                  <th className="py-3">Units</th>
                  <th className="py-3">Buy NAV</th>
                  <th className="py-3">Current NAV</th>
                  <th className="py-3">Current Value</th>
                  <th className="py-3">P/L</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-slate-950">{row.wealth_customers?.name ?? "Customer"}</p>
                      <p className="text-slate-500">{row.fund_name}</p>
                      <p className="text-xs text-slate-400">Scheme {row.scheme_code ?? "—"} · {row.investment_date}</p>
                    </td>
                    <td className="py-4 pr-4 font-semibold">{formatInr(row.amount_invested)}</td>
                    <td className="py-4 pr-4">{formatNumber(row.units_bought, 4)}</td>
                    <td className="py-4 pr-4">₹{formatNumber(row.nav_on_investment_date, 4)}</td>
                    <td className="py-4 pr-4">
                      {row.latestNav ? `₹${formatNumber(row.latestNav, 4)}` : "Not found"}
                      <p className="text-xs text-slate-400">{row.navDate ? new Date(row.navDate).toLocaleDateString("en-IN") : ""}</p>
                    </td>
                    <td className="py-4 pr-4 font-semibold">{formatInr(row.currentValue)}</td>
                    <td className={row.profitLoss >= 0 ? "py-4 pr-4 font-semibold text-emerald-700" : "py-4 pr-4 font-semibold text-red-600"}>
                      {row.profitLoss >= 0 ? "+" : ""}{formatInr(row.profitLoss)}
                      <p className="text-xs">{row.returnPercent}%</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {investments.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
                No investment entries yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
