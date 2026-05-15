import Link from "next/link";
import { requirePortalRole } from "@/lib/servicesPortalAuth";
import { supabaseServer } from "@/lib/supabase";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  normalizePhoneDisplay,
} from "@/lib/servicePortalFormat";

const requestOptions = [
  { label: "Invest More", value: "invest" },
  { label: "Withdraw", value: "withdraw" },
  { label: "Start SIP", value: "sip_start" },
  { label: "Stop SIP", value: "sip_stop" },
  { label: "Change SIP", value: "sip_change" },
];

const buildWhatsAppUrl = () => {
  const raw =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent("Hi, I need support from Sangro Services.")}`;
};

type SearchParams = {
  request?: string;
  success?: string;
  error?: string;
};

export default async function ServicesPortalDashboard({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requirePortalRole("customer", "/services-portal/login");
  const params = await searchParams;
  const sb = supabaseServer();

  const [{ data: holdings }, { data: policies }, { data: loans }, { data: requests }] =
    await Promise.all([
      sb
        .from("mutual_fund_holdings")
        .select("id, fund_name, scheme_code, folio_number, units, invested_amount, sip_amount, last_updated, latest_nav, current_value, profit_loss")
        .eq("customer_id", session.profile.id)
        .order("fund_name"),
      sb
        .from("insurance_policies")
        .select("id, policy_name, company, premium_amount, renewal_date, document_url")
        .eq("customer_id", session.profile.id)
        .order("renewal_date"),
      sb
        .from("loans")
        .select("id, loan_type, total_amount, emi, due_date, status")
        .eq("customer_id", session.profile.id)
        .order("due_date"),
      sb
        .from("service_requests")
        .select("id, request_type, message, amount, status, created_at")
        .eq("customer_id", session.profile.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  const holdingCards = (holdings ?? []).map((holding) => {
    const nav = Number(holding.latest_nav ?? 0);
    const currentValue = Number(holding.current_value ?? 0);
    const investedAmount = Number(holding.invested_amount ?? 0);
    const profitLoss = Number(holding.profit_loss ?? currentValue - investedAmount);
    return {
      ...holding,
      nav,
      currentValue,
      profitLoss,
    };
  });

  const totals = holdingCards.reduce(
    (acc, holding) => {
      acc.invested += Number(holding.invested_amount ?? 0);
      acc.current += Number(holding.currentValue ?? 0);
      acc.sip += Number(holding.sip_amount ?? 0);
      return acc;
    },
    { invested: 0, current: 0, sip: 0 }
  );

  const whatsappHref = buildWhatsAppUrl();
  const callHref = session.profile.phone
    ? `tel:${session.profile.phone}`
    : `tel:${process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? ""}`;
  const selectedRequest =
    requestOptions.find((item) => item.value === params.request)?.value ?? "invest";

  return (
    <div className="space-y-6 pb-24">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Tracking only
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
          One dashboard for mutual funds, finance, and insurance
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This dashboard is for tracking and service requests only. All mutual fund transactions are executed through official platforms.
        </p>
      </section>

      <section id="mutual-funds" className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total invested", value: formatMoney(totals.invested) },
          { label: "Current value", value: formatMoney(totals.current) },
          {
            label: "Profit / Loss",
            value: formatMoney(totals.current - totals.invested),
          },
        ].map((card) => (
          <div key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              {card.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-950">Mutual Funds</h3>
            <p className="text-sm text-slate-600">
              Total SIP tracked: {formatMoney(totals.sip)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {requestOptions.map((item) => (
              <Link
                key={item.value}
                href={`/services-portal?request=${item.value}#service-request`}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {holdingCards.map((holding) => (
            <article key={holding.id} className="rounded-3xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-semibold text-slate-950">{holding.fund_name}</h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Scheme code {holding.scheme_code} · Folio {holding.folio_number || "pending"}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  NAV {holding.nav ? holding.nav.toFixed(2) : "Pending"}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Units</p>
                  <p className="mt-1 font-semibold text-slate-950">{Number(holding.units).toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Invested</p>
                  <p className="mt-1 font-semibold text-slate-950">{formatMoney(holding.invested_amount)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Latest NAV</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {holding.nav ? holding.nav.toFixed(2) : "Pending"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Current value</p>
                  <p className="mt-1 font-semibold text-slate-950">{formatMoney(holding.currentValue)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Profit / Loss</p>
                  <p className={`mt-1 font-semibold ${holding.profitLoss >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {formatMoney(holding.profitLoss)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                Last updated {formatDateTime(holding.last_updated)}
              </p>
            </article>
          ))}
          {holdingCards.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No mutual fund holdings have been added yet.
            </div>
          ) : null}
        </div>
      </section>

      <section id="insurance" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-950">Insurance</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(policies ?? []).map((policy) => (
            <article key={policy.id} className="rounded-3xl border border-slate-200 p-5">
              <h4 className="text-lg font-semibold text-slate-950">{policy.policy_name}</h4>
              <p className="mt-1 text-sm text-slate-600">{policy.company}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">Premium</span>
                <strong>{formatMoney(policy.premium_amount)}</strong>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Renewal date</span>
                <strong className="text-amber-700">{formatDate(policy.renewal_date)}</strong>
              </div>
              {policy.document_url ? (
                <a
                  href={policy.document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  View document
                </a>
              ) : null}
            </article>
          ))}
          {(!policies || policies.length === 0) && (
            <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No insurance policies have been added yet.
            </div>
          )}
        </div>
      </section>

      <section id="loans" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-950">Loans</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {(loans ?? []).map((loan) => (
            <article key={loan.id} className="rounded-3xl border border-slate-200 p-5">
              <h4 className="text-lg font-semibold text-slate-950">{loan.loan_type}</h4>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">Loan amount</span>
                <strong>{formatMoney(loan.total_amount)}</strong>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">EMI</span>
                <strong>{formatMoney(loan.emi)}</strong>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Due date</span>
                <strong>{formatDate(loan.due_date)}</strong>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-500">Status</span>
                <strong className="capitalize">{loan.status}</strong>
              </div>
            </article>
          ))}
          {(!loans || loans.length === 0) && (
            <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No loan details are available yet.
            </div>
          )}
        </div>
      </section>

      <section id="service-request" className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-xl font-semibold text-slate-950">Service Requests</h3>
          {params.success ? (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Your request has been sent to the Sangro team.
            </div>
          ) : null}
          {params.error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              We could not save the request. Please try again.
            </div>
          ) : null}
          <form className="mt-5 grid gap-4" method="post" action="/api/services/request">
            <label className="text-sm font-medium text-slate-700">
              Request type
              <select
                name="type"
                defaultValue={selectedRequest}
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                {requestOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Amount (optional)
              <input
                name="amount"
                type="number"
                placeholder="e.g. 25000"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Message
              <textarea
                name="message"
                rows={4}
                placeholder="Tell us what you need help with."
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <button className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white">
              Submit request
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <section id="support" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-950">Support</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Reach the Sangro team for finance, insurance, and mutual fund service requests.
            </p>
            <div className="mt-5 grid gap-3">
              {whatsappHref ? (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-black px-4 py-3 text-center text-sm font-semibold text-white"
                >
                  WhatsApp support
                </a>
              ) : null}
              <a
                href={callHref}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-800"
              >
                Call support
              </a>
              <p className="text-sm text-slate-500">
                Your registered contact: {normalizePhoneDisplay(session.profile.phone) || session.profile.email}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-950">Recent requests</h3>
            <div className="mt-4 space-y-3">
              {(requests ?? []).map((request) => (
                <article key={request.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <strong className="capitalize">
                      {request.request_type.replace("_", " ")}
                    </strong>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {request.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {request.message || "No message added."}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {request.amount ? `${formatMoney(request.amount)} · ` : ""}
                    {formatDateTime(request.created_at)}
                  </p>
                </article>
              ))}
              {(!requests || requests.length === 0) && (
                <p className="text-sm text-slate-500">No service requests yet.</p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
