import { saveLoanAction } from "@/app/services-admin/actions";
import { supabaseServer } from "@/lib/supabase";
import { formatDate, formatMoney } from "@/lib/servicePortalFormat";

const renderMessage = (success?: string, error?: string) => {
  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        Loan details saved successfully.
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

export default async function ServicesAdminLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sb = supabaseServer();
  const [{ data: customers }, { data: loans }] = await Promise.all([
    sb.from("profiles").select("id, name, email").eq("role", "customer").order("name"),
    sb
      .from("loans")
      .select("id, customer_id, loan_type, total_amount, emi, due_date, status")
      .order("created_at", { ascending: false }),
  ]);

  const customerMap = new Map((customers ?? []).map((customer) => [customer.id, customer]));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Loans</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Track loan amounts, EMIs, and due dates so customer support stays
          organized without handling real transactions in the app.
        </p>
      </section>

      {renderMessage(params.success, params.error)}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form
          action={saveLoanAction}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <input type="hidden" name="redirect_to" value="/services-admin/loans" />
          <h3 className="text-xl font-semibold text-slate-950">Add loan</h3>
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
              Loan type
              <input
                required
                name="loan_type"
                placeholder="Vehicle loan"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Total amount
                <input
                  required
                  name="total_amount"
                  type="number"
                  step="0.01"
                  placeholder="600000"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                EMI
                <input
                  required
                  name="emi"
                  type="number"
                  step="0.01"
                  placeholder="15400"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Due date
                <input
                  name="due_date"
                  type="date"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Status
                <select
                  name="status"
                  defaultValue="active"
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </label>
            </div>
            <button className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white">
              Save loan
            </button>
          </div>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-slate-950">Loan tracker</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {(loans ?? []).length} loans
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {(loans ?? []).map((loan) => (
              <article key={loan.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-950">
                      {loan.loan_type}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {customerMap.get(loan.customer_id)?.name || "Customer"}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                    {loan.status}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Loan amount</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {formatMoney(loan.total_amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">EMI</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {formatMoney(loan.emi)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Due date</p>
                    <p className="mt-1 font-semibold text-slate-950">
                      {formatDate(loan.due_date)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
            {(!loans || loans.length === 0) && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                No loan details have been added yet.
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
