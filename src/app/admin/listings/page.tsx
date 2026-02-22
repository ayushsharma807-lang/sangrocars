import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { parsePrivateSellerDescription } from "@/lib/privateSeller";

type ListingRow = {
  id: string;
  dealer_id: string | null;
  make: string | null;
  model: string | null;
  variant: string | null;
  year: number | null;
  price: number | null;
  location: string | null;
  status: string | null;
  type: string | null;
  description: string | null;
  created_at: string | null;
  last_seen_at: string | null;
};

type DealerLite = {
  id: string;
  name: string | null;
};

type SearchParams = {
  q?: string | string[];
  status?: string | string[];
  type?: string | string[];
  owner?: string | string[];
  sort?: string | string[];
  dealer_id?: string | string[];
  action?: string | string[];
  error?: string | string[];
};

const getParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatPrice = (value?: number | null) => {
  if (!value) return "—";
  return `₹${value.toLocaleString("en-IN")}`;
};

const toTitle = (value?: string | null) => {
  if (!value) return "—";
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const buildQueryPath = (
  base: string,
  values: Record<string, string | null | undefined>
) => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) query.set(key, value);
  }
  const text = query.toString();
  return text ? `${base}?${text}` : base;
};

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect("/admin/login?error=unauthorized");
  }

  const params = await searchParams;
  const filters = {
    q: getParam(params.q)?.trim() ?? "",
    status: getParam(params.status)?.trim() ?? "",
    type: getParam(params.type)?.trim() ?? "",
    owner: getParam(params.owner)?.trim() ?? "",
    sort: getParam(params.sort)?.trim() ?? "recent",
    dealerId: getParam(params.dealer_id)?.trim() ?? "",
  };
  const action = getParam(params.action) ?? "";
  const errorText = getParam(params.error) ?? "";

  const sb = supabaseServer();
  let query = sb
    .from("listings")
    .select(
      "id, dealer_id, make, model, variant, year, price, location, status, type, description, created_at, last_seen_at"
    );

  if (filters.q) {
    query = query.or(
      `make.ilike.%${filters.q}%,model.ilike.%${filters.q}%,variant.ilike.%${filters.q}%,location.ilike.%${filters.q}%`
    );
  }
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.dealerId) query = query.eq("dealer_id", filters.dealerId);
  if (filters.owner === "dealer") query = query.not("dealer_id", "is", null);
  if (filters.owner === "private") query = query.is("dealer_id", null);

  switch (filters.sort) {
    case "price_desc":
      query = query.order("price", { ascending: false, nullsFirst: false });
      break;
    case "price_asc":
      query = query.order("price", { ascending: true, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query.limit(2000);
  const listings = (data ?? []) as ListingRow[];

  const dealerIds = Array.from(
    new Set(listings.map((listing) => listing.dealer_id).filter(Boolean))
  ) as string[];
  const dealerMap = new Map<string, string>();
  if (dealerIds.length > 0) {
    const { data: dealerRows } = await sb
      .from("dealers")
      .select("id, name")
      .in("id", dealerIds);
    for (const dealer of (dealerRows ?? []) as DealerLite[]) {
      dealerMap.set(dealer.id, dealer.name ?? "Dealer");
    }
  }

  const returnPath = buildQueryPath("/admin/listings", {
    q: filters.q || null,
    status: filters.status || null,
    type: filters.type || null,
    owner: filters.owner || null,
    sort: filters.sort || null,
    dealer_id: filters.dealerId || null,
  });

  return (
    <main className="home">
      <section className="section admin">
        <div className="section__header">
          <div>
            <h2>All ads</h2>
            <p>Manage and delete any listing on the website.</p>
          </div>
          <div className="dealer__actions">
            <form method="post" action="/api/admin/logout">
              <button className="btn btn--ghost" type="submit">
                Log out
              </button>
            </form>
            <Link className="btn btn--outline" href="/admin/listings/new">
              Post car
            </Link>
            <Link className="btn btn--outline" href="/admin/dealers">
              Dealers
            </Link>
            <Link className="btn btn--solid" href="/">
              Back to home
            </Link>
          </div>
        </div>

        {error && (
          <div className="admin-banner admin-banner--error">
            Failed to load listings: {error.message}
          </div>
        )}
        {action === "listing_deleted" && (
          <div className="admin-banner">Listing deleted successfully.</div>
        )}
        {errorText && (
          <div className="admin-banner admin-banner--error">
            {decodeURIComponent(errorText)}
          </div>
        )}

        <form className="admin-filter" method="get">
          <label>
            Search
            <input
              name="q"
              placeholder="Make, model, variant, location"
              defaultValue={filters.q}
            />
          </label>
          <label>
            Status
            <select name="status" defaultValue={filters.status}>
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="expired">Expired</option>
            </select>
          </label>
          <label>
            Type
            <select name="type" defaultValue={filters.type}>
              <option value="">All</option>
              <option value="used">Used</option>
              <option value="new">New</option>
            </select>
          </label>
          <label>
            Owner
            <select name="owner" defaultValue={filters.owner}>
              <option value="">All</option>
              <option value="dealer">Dealer listings</option>
              <option value="private">Private listings</option>
            </select>
          </label>
          <label>
            Sort
            <select name="sort" defaultValue={filters.sort}>
              <option value="recent">Newest first</option>
              <option value="price_desc">Price high to low</option>
              <option value="price_asc">Price low to high</option>
            </select>
          </label>
          <button className="btn btn--solid" type="submit">
            Apply filters
          </button>
          <Link className="btn btn--ghost" href="/admin/listings">
            Clear
          </Link>
        </form>

        <div className="table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Car</th>
                <th>Owner</th>
                <th>Type</th>
                <th>Status</th>
                <th>Price</th>
                <th>Location</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    No listings found.
                  </td>
                </tr>
              ) : (
                listings.map((listing) => {
                  const title = [
                    listing.year ?? undefined,
                    toTitle(listing.make),
                    toTitle(listing.model),
                    toTitle(listing.variant),
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const privateSeller = parsePrivateSellerDescription(
                    listing.description
                  );
                  const ownerLabel = listing.dealer_id
                    ? dealerMap.get(listing.dealer_id) ?? "Dealer"
                    : privateSeller.seller.name || "Private seller";
                  const ownerType = listing.dealer_id ? "Dealer" : "Private";

                  return (
                    <tr key={listing.id}>
                      <td>{title || "Listing"}</td>
                      <td>
                        <div>{ownerLabel}</div>
                        <div className="notification-meta">{ownerType}</div>
                      </td>
                      <td>{toTitle(listing.type)}</td>
                      <td>
                        <span className="status-badge">{toTitle(listing.status)}</span>
                      </td>
                      <td>{formatPrice(listing.price)}</td>
                      <td>{listing.location || "—"}</td>
                      <td>{formatDate(listing.created_at || listing.last_seen_at)}</td>
                      <td>
                        <div className="admin-row-actions">
                          <Link className="link" href={`/listing/${listing.id}`}>
                            View
                          </Link>
                          <form
                            method="post"
                            action={`/api/admin/listings/${listing.id}/delete`}
                          >
                            <input type="hidden" name="return" value={returnPath} />
                            <button className="btn btn--ghost" type="submit">
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
