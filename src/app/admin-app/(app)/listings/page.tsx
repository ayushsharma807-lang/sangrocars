import Link from "next/link";
import { requireAdminApp } from "@/lib/adminAppGuard";
import { supabaseServer } from "@/lib/supabase";

const STATUSES = [
  { label: "All", value: "" },
  { label: "Drafts", value: "draft" },
  { label: "Published", value: "available" },
  { label: "Sold", value: "sold" },
  { label: "Archived", value: "archived" },
];

export default async function AdminAppListings({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; seller?: string }>;
}) {
  await requireAdminApp();
  const params = await searchParams;
  const status = (params.status ?? "").trim();
  const search = (params.search ?? "").trim();
  const seller = (params.seller ?? "").trim();
  const sb = supabaseServer();

  let query = sb
    .from("listings")
    .select(
      "id, make, model, variant, price, location, status, seller_name, dealer_id, created_at, featured"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }
  if (search) {
    query = query.or(
      `make.ilike.%${search}%,model.ilike.%${search}%,variant.ilike.%${search}%`
    );
  }
  if (seller) {
    query = query.ilike("seller_name", `%${seller}%`);
  }

  const { data } = await query;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Listings</h2>
          <p className="text-sm text-slate-600">
            Search, filter, and manage your inventory.
          </p>
        </div>
        <Link
          href="/admin-app/listings/new"
          className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white"
        >
          Add listing
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((tab) => (
          <Link
            key={tab.value || "all"}
            href={`/admin-app/listings?status=${tab.value}`}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              status === tab.value ? "bg-black text-white" : "border border-slate-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <label className="text-sm text-slate-600">
          Search
          <input
            name="search"
            defaultValue={search}
            placeholder="Make, model, variant"
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </label>
        <label className="text-sm text-slate-600">
          Seller / Dealer
          <input
            name="seller"
            defaultValue={seller}
            placeholder="Seller or dealer name"
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            className="w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white"
            type="submit"
          >
            Apply
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {(data ?? []).map((listing) => (
          <div
            key={listing.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {[listing.make, listing.model, listing.variant]
                    .filter(Boolean)
                    .join(" ")}
                </p>
                <p className="text-xs text-slate-500">
                  {listing.location || "Location pending"} · {listing.status}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin-app/listings/${listing.id}/edit`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin-app/listings/${listing.id}/preview`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  Preview
                </Link>
                <Link
                  href={`/listing/${listing.id}`}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  Public
                </Link>
              </div>
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            No listings found. Add your first car listing.
          </div>
        )}
      </div>
    </div>
  );
}
