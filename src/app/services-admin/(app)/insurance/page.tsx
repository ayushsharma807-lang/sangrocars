import { saveInsurancePolicyAction } from "@/app/services-admin/actions";
import { supabaseServer } from "@/lib/supabase";
import { formatDate, formatMoney } from "@/lib/servicePortalFormat";

const renderMessage = (success?: string, error?: string) => {
  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        Insurance policy saved successfully.
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

export default async function ServicesAdminInsurancePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sb = supabaseServer();
  const [{ data: customers }, { data: policies }] = await Promise.all([
    sb.from("profiles").select("id, name, email").eq("role", "customer").order("name"),
    sb
      .from("insurance_policies")
      .select("id, customer_id, policy_name, company, premium_amount, renewal_date, document_url")
      .order("renewal_date"),
  ]);

  const customerMap = new Map((customers ?? []).map((customer) => [customer.id, customer]));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          Insurance
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Track policy coverage, upload supporting documents, and keep upcoming
          renewals visible for quick follow-up.
        </p>
      </section>

      {renderMessage(params.success, params.error)}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form
          action={saveInsurancePolicyAction}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <input type="hidden" name="redirect_to" value="/services-admin/insurance" />
          <h3 className="text-xl font-semibold text-slate-950">Add policy</h3>
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
              Policy name
              <input
                required
                name="policy_name"
                placeholder="Vehicle comprehensive policy"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Company
              <input
                required
                name="company"
                placeholder="ICICI Lombard"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Premium amount
                <input
                  name="premium_amount"
                  type="number"
                  step="0.01"
                  placeholder="18500"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Renewal date
                <input
                  required
                  name="renewal_date"
                  type="date"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </label>
            </div>
            <label className="text-sm font-medium text-slate-700">
              Policy document (optional)
              <input
                name="document"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="mt-2 block w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold"
              />
            </label>
            <button className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white">
              Save policy
            </button>
          </div>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-slate-950">Tracked policies</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {(policies ?? []).length} policies
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {(policies ?? []).map((policy) => (
              <article key={policy.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-950">
                      {policy.policy_name}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {customerMap.get(policy.customer_id)?.name || "Customer"} · {policy.company}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {formatMoney(policy.premium_amount)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Renewal due on <span className="font-semibold">{formatDate(policy.renewal_date)}</span>
                </p>
                {policy.document_url ? (
                  <a
                    href={policy.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    View document
                  </a>
                ) : null}
              </article>
            ))}
            {(!policies || policies.length === 0) && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                No insurance policies have been added yet.
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
