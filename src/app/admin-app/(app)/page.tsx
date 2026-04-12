import Link from "next/link";
import { requireAdminApp } from "@/lib/adminAppGuard";
import { supabaseServer } from "@/lib/supabase";

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

export default async function AdminAppDashboard() {
  await requireAdminApp();
  const sb = supabaseServer();

  const [{ count: activeCount }, { count: draftCount }, { count: soldCount }, { count: leadCount }] =
    await Promise.all([
      sb
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "available"),
      sb
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft"),
      sb
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("status", "sold"),
      sb
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
    ]);

  const { data: recentListings } = await sb
    .from("listings")
    .select("id, make, model, variant, price, location, created_at, status")
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentLeads } = await sb
    .from("leads")
    .select("id, name, phone, listing_title, created_at, status")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-600">
          Quick overview of listings and lead activity.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active listings", value: activeCount ?? 0 },
          { label: "Draft listings", value: draftCount ?? 0 },
          { label: "Sold listings", value: soldCount ?? 0 },
          { label: "New leads", value: leadCount ?? 0 },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Recent listings
            </h3>
            <Link className="text-xs text-slate-500" href="/admin-app/listings">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {(recentListings ?? []).map((listing) => (
              <Link
                key={listing.id}
                href={`/admin-app/listings/${listing.id}/edit`}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm text-slate-700"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {[listing.make, listing.model, listing.variant]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {listing.location || "Location pending"} ·{" "}
                    {formatDate(listing.created_at)}
                  </p>
                </div>
                <span className="text-xs font-semibold uppercase text-slate-500">
                  {listing.status}
                </span>
              </Link>
            ))}
            {(!recentListings || recentListings.length === 0) && (
              <p className="text-sm text-slate-500">No listings yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">
              Recent leads
            </h3>
            <Link className="text-xs text-slate-500" href="/admin-app/leads">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {(recentLeads ?? []).map((lead) => (
              <div
                key={lead.id}
                className="rounded-xl border border-slate-100 px-3 py-2 text-sm text-slate-700"
              >
                <p className="font-medium text-slate-900">{lead.name}</p>
                <p className="text-xs text-slate-500">
                  {lead.listing_title || "No listing"} · {formatDate(lead.created_at)}
                </p>
              </div>
            ))}
            {(!recentLeads || recentLeads.length === 0) && (
              <p className="text-sm text-slate-500">No leads yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
