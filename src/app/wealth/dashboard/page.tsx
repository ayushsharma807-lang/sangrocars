import Link from "next/link";
import { requirePortalRole } from "@/lib/servicesPortalAuth";
import { supabaseServer } from "@/lib/supabase";
import {
  enrichInvestmentsWithNav,
  formatInr,
  formatNumber,
  type WealthInvestment,
} from "@/lib/wealth";

export const dynamic = "force-dynamic";

export default async function WealthDashboardPage() {
  const session = await requirePortalRole("customer", "/wealth/login");
  const sb = supabaseServer();

  let { data: customer } = await sb
    .from("wealth_customers")
    .select("id,name,phone,email,city,status")
    .eq("profile_id", session.profile.id)
    .maybeSingle();

  if (!customer && session.profile.email) {
    const byEmail = await sb
      .from("wealth_customers")
      .select("id,name,phone,email,city,status")
      .eq("email", session.profile.email)
      .maybeSingle();
    customer = byEmail.data ?? null;
    if (customer?.id) {
      await sb.from("wealth_customers").update({ profile_id: session.profile.id }).eq("id", customer.id);
    }
  }

  const { data: rawInvestments } = customer?.id
    ? await sb
        .from("wealth_investments")
        .select("id,customer_id,fund_name,scheme_code,investment_date,amount_invested,nav_on_investment_date,units_bought,transaction_type,notes,created_at")
        .eq("customer_id", customer.id)
        .order("investment_date", { ascending: false })
    : { data: [] };

  const investments = await enrichInvestmentsWithNav((rawInvestments ?? []) as WealthInvestment[]);
  const totalInvested = investments.reduce((sum, item) => sum + item.amount_invested, 0);
  const currentValue = investments.reduce((sum, item) => sum + item.currentValue, 0);
  const profitLoss = currentValue - totalInvested;
  const returnPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;
  const latestNavDate = investments
    .map((item) => item.navDate)
    .filter(Boolean)
    .sort()
    .at(-1);
  const supportMessage = encodeURIComponent(
    "Hi Sangro Wealth, please activate my portfolio dashboard."
  );

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/wealth/dashboard" className="flex items-center gap-3">
            <img src="/images/sangrocars-logo.png" alt="Sangro" className="h-11 w-11 rounded-2xl border border-slate-200 object-contain p-1" />
            <div>
              <p className="font-semibold">Sangro Wealth</p>
              <p className="text-xs text-slate-500">Customer dashboard</p>
            </div>
          </Link>
          <form method="post" action="/api/services/logout">
            <input type="hidden" name="next" value="/wealth/login" />
            <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold" type="submit">
              Logout
            </button>
          </form>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Portfolio</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Welcome, {customer?.name ?? session.profile.name ?? "Investor"}
          </h1>
          <p className="mt-2 text-slate-600">
            Tracking dashboard only. Transactions are handled manually through
            official platforms.
          </p>
          <p className="mt-2 text-sm font-semibold text-emerald-700">
            {latestNavDate
              ? `Last NAV updated ${new Date(latestNavDate).toLocaleDateString("en-IN")}`
              : "Latest NAV will appear after investments are added."}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[28px] border border-slate-200 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <p className="text-sm text-slate-500">Total invested</p>
            <p className="mt-3 text-3xl font-semibold">{formatInr(totalInvested)}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <p className="text-sm text-slate-500">Current value</p>
            <p className="mt-3 text-3xl font-semibold">{formatInr(currentValue)}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <p className="text-sm text-slate-500">Profit / loss</p>
            <p className={`mt-3 text-3xl font-semibold ${profitLoss >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {profitLoss >= 0 ? "+" : ""}{formatInr(profitLoss)}
            </p>
          </div>
          <div className="rounded-[28px] border border-slate-200 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <p className="text-sm text-slate-500">Return</p>
            <p className={`mt-3 text-3xl font-semibold ${returnPercent >= 0 ? "text-emerald-700" : "text-red-600"}`}>
              {returnPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-slate-200 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
            <h2 className="text-xl font-semibold">Your funds</h2>
            <div className="mt-5 space-y-4">
              {investments.map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div>
                      <p className="font-semibold">{item.fund_name}</p>
                      <p className="text-sm text-slate-500">
                        {item.transaction_type === "sip" ? "SIP" : "Lump Sum"} · {item.investment_date}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <p className="font-semibold">{formatInr(item.currentValue)}</p>
                      <p className={item.profitLoss >= 0 ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
                        {item.profitLoss >= 0 ? "+" : ""}{formatInr(item.profitLoss)} ({item.returnPercent}%)
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Units</p>
                      <p className="font-semibold">{formatNumber(item.units_bought, 4)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Purchase NAV</p>
                      <p className="font-semibold">₹{formatNumber(item.nav_on_investment_date, 4)}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">Latest NAV</p>
                      <p className="font-semibold">{item.latestNav ? `₹${formatNumber(item.latestNav, 4)}` : "Pending"}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="text-slate-500">NAV date</p>
                      <p className="font-semibold">{item.navDate ? new Date(item.navDate).toLocaleDateString("en-IN") : "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
              {investments.length === 0 && (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
                  <p className="text-2xl font-semibold text-slate-950">
                    No investments added yet.
                  </p>
                  <p className="mx-auto mt-3 max-w-md text-slate-600">
                    Contact Sangro Wealth to activate your portfolio. Once an
                    admin adds your investments, this dashboard updates with
                    latest NAV, units, value and returns.
                  </p>
                  <a
                    href={`https://wa.me/919041322997?text=${supportMessage}`}
                    className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_35px_rgba(5,150,105,0.22)]"
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp Sangro Wealth
                  </a>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-semibold">Growth chart</h2>
              <div className="mt-5 flex h-56 items-end gap-2 rounded-3xl bg-gradient-to-b from-emerald-50 to-white p-5">
                {[34, 46, 42, 58, 64, 72, 68, 82, 90, 88, 96, 100].map((height, index) => (
                  <div key={index} className="flex-1 rounded-t-full bg-emerald-500/80" style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
              <h2 className="text-xl font-semibold">Support</h2>
              <p className="mt-2 text-sm text-slate-600">For invest, withdraw, SIP start/stop or document help, contact us.</p>
              <div className="mt-4 grid gap-2">
                <a href="tel:9041322997" className="rounded-full bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white">Call Sangro</a>
                <a href="https://wa.me/919041322997" className="rounded-full border border-slate-300 px-4 py-3 text-center text-sm font-semibold">WhatsApp</a>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-8 rounded-[28px] border border-slate-200 p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold">Transaction history</h2>
              <p className="mt-1 text-sm text-slate-500">
                Admin-entered investment records linked to your portfolio.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              {investments.length} entries
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {investments.map((item) => (
              <div
                key={`history-${item.id}`}
                className="grid gap-3 rounded-2xl border border-slate-200 p-4 sm:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr]"
              >
                <div>
                  <p className="font-semibold">{item.fund_name}</p>
                  <p className="text-sm text-slate-500">
                    {item.investment_date} · {item.transaction_type === "sip" ? "SIP" : "Lump Sum"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Invested
                  </p>
                  <p className="font-semibold">{formatInr(item.amount_invested)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Units
                  </p>
                  <p className="font-semibold">{formatNumber(item.units_bought, 4)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Current value
                  </p>
                  <p className="font-semibold">{formatInr(item.currentValue)}</p>
                </div>
              </div>
            ))}
            {investments.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                No transaction history yet.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
