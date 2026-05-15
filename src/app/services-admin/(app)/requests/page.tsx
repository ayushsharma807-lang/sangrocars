import { updateRequestStatusAction } from "@/app/services-admin/actions";
import { supabaseServer } from "@/lib/supabase";
import { formatDateTime, formatMoney } from "@/lib/servicePortalFormat";

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const renderMessage = (success?: string, error?: string) => {
  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        Request status updated successfully.
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

export default async function ServicesAdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const sb = supabaseServer();
  const [{ data: customers }, { data: requests }] = await Promise.all([
    sb.from("profiles").select("id, name, phone, email").eq("role", "customer"),
    sb
      .from("service_requests")
      .select("id, customer_id, request_type, message, amount, status, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const customerMap = new Map((customers ?? []).map((customer) => [customer.id, customer]));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          Service Requests
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Review customer requests for mutual fund service actions and keep the
          tracking dashboard updated manually after work is completed.
        </p>
      </section>

      {renderMessage(params.success, params.error)}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          {(requests ?? []).map((request) => {
            const customer = customerMap.get(request.customer_id);
            return (
              <article key={request.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold capitalize text-slate-950">
                        {request.request_type.replace("_", " ")}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                        {request.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {customer?.name || "Customer"} · {customer?.email || customer?.phone || "No contact"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {request.message || "No message added."}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      {request.amount ? `${formatMoney(request.amount)} · ` : ""}
                      {formatDateTime(request.created_at)}
                    </p>
                  </div>

                  <form action={updateRequestStatusAction} className="flex flex-col gap-3 lg:min-w-56">
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="redirect_to" value="/services-admin/requests" />
                    <label className="text-sm font-medium text-slate-700">
                      Update status
                      <select
                        name="status"
                        defaultValue={request.status}
                        className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white">
                      Save status
                    </button>
                  </form>
                </div>
              </article>
            );
          })}

          {(!requests || requests.length === 0) && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
              No service requests have come in yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
