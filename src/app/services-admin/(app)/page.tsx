import { supabaseServer } from "@/lib/supabase";
import { formatDate, formatDateTime, formatMoney } from "@/lib/servicePortalFormat";
import NavSyncButton from "@/app/services-admin/components/NavSyncButton";

type SearchParams = {
  nav_sync?: string;
  message?: string;
};

export default async function ServicesAdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const sb = supabaseServer();
  const [
    { count: customerCount },
    { count: holdingCount },
    { count: pendingCount },
    { count: insuranceCount },
    { count: loanCount },
    { data: customers },
    { data: recentRequests },
    { data: latestNavHolding },
    { count: navReadyCount },
  ] = await Promise.all([
    sb.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    sb.from("mutual_fund_holdings").select("id", { count: "exact", head: true }),
    sb.from("service_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    sb.from("insurance_policies").select("id", { count: "exact", head: true }),
    sb.from("loans").select("id", { count: "exact", head: true }),
    sb.from("profiles").select("id, name").eq("role", "customer"),
    sb
      .from("service_requests")
      .select("id, customer_id, request_type, status, amount, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    sb
      .from("mutual_fund_holdings")
      .select("last_updated")
      .not("scheme_code", "is", null)
      .order("last_updated", { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from("mutual_fund_holdings")
      .select("id", { count: "exact", head: true })
      .gt("latest_nav", 0),
  ]);

  const customerMap = new Map((customers ?? []).map((customer) => [customer.id, customer.name]));
  const navStatus =
    params.nav_sync === "success"
      ? "success"
      : params.nav_sync === "error"
        ? "error"
        : null;
  const latestSyncAt = latestNavHolding?.last_updated
    ? new Date(latestNavHolding.last_updated)
    : null;
  const isNavStale = latestSyncAt
    ? Date.now() - latestSyncAt.getTime() > 24 * 60 * 60 * 1000
    : true;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
          Services dashboard
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Manage customer tracking, requests, insurance, and loans from one place.
        </p>
      </section>

      {navStatus ? (
        <section
          className={`rounded-3xl border p-4 shadow-sm ${
            navStatus === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <p className="text-sm font-medium">
            {navStatus === "success"
              ? "Latest NAV sync completed successfully."
              : params.message || "NAV sync failed."}
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Customers", value: customerCount ?? 0 },
          { label: "MF holdings", value: holdingCount ?? 0 },
          { label: "Pending requests", value: pendingCount ?? 0 },
          { label: "Policies", value: insuranceCount ?? 0 },
          { label: "Loans", value: loanCount ?? 0 },
          {
            label: "NAV ready",
            value: `${navReadyCount ?? 0}/${holdingCount ?? 0}`,
            hint: latestNavHolding?.last_updated
              ? `Last sync ${formatDateTime(latestNavHolding.last_updated)}`
              : "No NAV sync yet",
            tone:
              navReadyCount && !isNavStale
                ? "healthy"
                : navReadyCount
                  ? "stale"
                  : "empty",
          },
        ].map((card) => (
          <article key={card.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              {"tone" in card ? (
                <span
                  className={`inline-flex h-2.5 w-2.5 rounded-full ${
                    card.tone === "healthy"
                      ? "bg-emerald-500"
                      : card.tone === "stale"
                        ? "bg-amber-500"
                        : "bg-slate-300"
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                {card.label}
              </p>
            </div>
            <p className="mt-3 text-2xl font-semibold text-slate-950">{card.value}</p>
            {"hint" in card && card.hint ? (
              <p className="mt-2 text-xs text-slate-500">{card.hint}</p>
            ) : null}
            {"tone" in card && card.tone === "stale" ? (
              <p className="mt-2 text-xs font-medium text-amber-700">
                NAV data is older than 24 hours.
              </p>
            ) : null}
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-slate-950">Recent service requests</h3>
          <form action="/api/mutual-funds/sync-nav" method="post">
            <NavSyncButton />
          </form>
        </div>
        <div className="mt-5 grid gap-3">
          {(recentRequests ?? []).map((request) => (
            <article key={request.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="capitalize text-slate-950">
                  {customerMap.get(request.customer_id) || "Customer"} · {request.request_type.replace("_", " ")}
                </strong>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                  {request.status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {request.amount ? `${formatMoney(request.amount)} · ` : ""}
                {formatDate(request.created_at)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
