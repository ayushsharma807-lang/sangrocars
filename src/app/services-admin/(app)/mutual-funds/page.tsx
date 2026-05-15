import { saveHoldingAction } from "@/app/services-admin/actions";
import { supabaseServer } from "@/lib/supabase";
import { formatDateTime, formatMoney } from "@/lib/servicePortalFormat";

const renderMessage = (success?: string, error?: string) => {
  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        Mutual fund holding saved successfully.
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {decodeURIComponent(error)}
      </div>
    );
  }

  return null;
};

export default async function ServicesAdminMutualFundsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sb = supabaseServer();
  const [{ data: customers }, { data: holdings }] = await Promise.all([
    sb.from("profiles").select("id, name, email").eq("role", "customer").order("name"),
    sb
      .from("mutual_fund_holdings")
      .select(
        "id, customer_id, fund_name, scheme_code, folio_number, units, invested_amount, sip_amount, last_updated"
      )
      .order("last_updated", { ascending: false }),
  ]);

  const customerMap = new Map((customers ?? []).map((customer) => [customer.id, customer]));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          Mutual Funds
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Add customer holdings, SIP amounts, and AMFI scheme codes so the
          dashboard can calculate the latest tracked value.
        </p>
      </section>

      {renderMessage(params.success, params.error)}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form
          action={saveHoldingAction}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <input type="hidden" name="redirect_to" value="/services-admin/mutual-funds" />
          <h3 className="text-xl font-semibold text-slate-950">Add holding</h3>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-medium text-slate-700">
              Customer
              <select
                required
                name="customer_id"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
              >
                <option value="">Select customer</option>
                {(customers ?? []).map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.email ? `· ${customer.email}` : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Fund name
              <input
                required
                name="fund_name"
                placeholder="Parag Parikh Flexi Cap Fund"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Scheme code
              <input
                required
                name="scheme_code"
                placeholder="122639"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Folio number
              <input
                name="folio_number"
                placeholder="Optional folio number"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium text-slate-700">
                Units
                <input
                  required
                  name="units"
                  type="number"
                  step="0.0001"
                  placeholder="12.5421"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Invested amount
                <input
                  required
                  name="invested_amount"
                  type="number"
                  step="0.01"
                  placeholder="250000"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                SIP amount
                <input
                  name="sip_amount"
                  type="number"
                  step="0.01"
                  placeholder="5000"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
              </label>
            </div>
            <button className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white">
              Save holding
            </button>
          </div>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-slate-950">Tracked holdings</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {(holdings ?? []).length} holdings
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {(holdings ?? []).map((holding) => (
              <article key={holding.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-950">
                      {holding.fund_name}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {customerMap.get(holding.customer_id)?.name || "Customer"} · Scheme{" "}
                      {holding.scheme_code}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    SIP {formatMoney(holding.sip_amount)}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Units</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {Number(holding.units).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Invested</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {formatMoney(holding.invested_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Folio</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {holding.folio_number || "Pending"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Updated {formatDateTime(holding.last_updated)}
                </p>
              </article>
            ))}
            {(!holdings || holdings.length === 0) && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                No holdings have been added yet.
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
