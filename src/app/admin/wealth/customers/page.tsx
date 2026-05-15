import { supabaseServer } from "@/lib/supabase";
import { createWealthCustomerAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function WealthCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sb = supabaseServer();
  const { data: customers, error } = await sb
    .from("wealth_customers")
    .select("id,name,phone,email,pan_placeholder,city,joined_date,status,created_at")
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Investor CRM</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Customer investors</h1>
        <p className="mt-2 text-slate-600">Create profiles manually and link future customer logins by email.</p>
      </div>

      {params.created && <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">Customer created.</div>}
      {params.error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Could not save customer.</div>}
      {error && <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error.message}</div>}

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <form action={createWealthCustomerAction} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-semibold">Add investor</h2>
          <div className="mt-5 grid gap-4">
            <label className="text-sm font-semibold">
              Customer name
              <input name="name" required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="e.g., Rahul Sharma" />
            </label>
            <label className="text-sm font-semibold">
              Phone
              <input name="phone" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="9876543210" />
            </label>
            <label className="text-sm font-semibold">
              Email
              <input name="email" type="email" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="customer@gmail.com" />
            </label>
            <label className="text-sm font-semibold">
              PAN placeholder
              <input name="pan_placeholder" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="ABCDE1234F or pending" />
            </label>
            <label className="text-sm font-semibold">
              City
              <input name="city" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Jalandhar" />
            </label>
            <label className="text-sm font-semibold">
              Status
              <select name="status" className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <button className="mt-5 w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white" type="submit">
            Create customer
          </button>
        </form>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.05)]">
          <h2 className="text-xl font-semibold">All investors</h2>
          <div className="mt-5 grid gap-3">
            {(customers ?? []).map((customer) => (
              <div key={customer.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-semibold">{customer.name}</p>
                    <p className="text-sm text-slate-500">
                      {customer.phone ?? "No phone"} {customer.email ? `· ${customer.email}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {customer.city ?? "No city"} · Joined {customer.joined_date ?? "today"}
                    </p>
                  </div>
                  <span className="w-fit rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold capitalize">
                    {customer.status}
                  </span>
                </div>
              </div>
            ))}
            {(customers ?? []).length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
                No customers yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
