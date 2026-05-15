import { createCustomerAction } from "@/app/services-admin/actions";
import { supabaseServer } from "@/lib/supabase";
import { formatDate, normalizePhoneDisplay } from "@/lib/servicePortalFormat";

const renderMessage = (success?: string, error?: string) => {
  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        Customer account created successfully.
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

export default async function ServicesAdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sb = supabaseServer();
  const { data: customers } = await sb
    .from("profiles")
    .select("id, name, phone, email, role, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          Customers
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Create customer logins for the tracking dashboard and keep all contact
          details in one place.
        </p>
      </section>

      {renderMessage(params.success, params.error)}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <form
          action={createCustomerAction}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <input type="hidden" name="redirect_to" value="/services-admin/customers" />
          <h3 className="text-xl font-semibold text-slate-950">Add customer</h3>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-medium text-slate-700">
              Full name
              <input
                required
                name="name"
                placeholder="Rahul Sharma"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <input
                required
                name="email"
                type="email"
                placeholder="rahul@example.com"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Phone
              <input
                name="phone"
                placeholder="9876543210"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Password
              <input
                required
                name="password"
                type="password"
                placeholder="Temporary password"
                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
              />
            </label>
            <button className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white">
              Create customer account
            </button>
          </div>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-semibold text-slate-950">All customers</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {(customers ?? []).length} total
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {(customers ?? []).map((customer) => (
              <article
                key={customer.id}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-950">
                      {customer.name}
                    </h4>
                    <p className="mt-1 text-sm text-slate-600">
                      {customer.email || "No email"} ·{" "}
                      {normalizePhoneDisplay(customer.phone)}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                    {customer.role}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Added {formatDate(customer.created_at)}
                </p>
              </article>
            ))}
            {(!customers || customers.length === 0) && (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                No customers have been added yet.
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
