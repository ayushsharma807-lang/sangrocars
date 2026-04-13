import Link from "next/link";
import BulkSelectAll from "../leads/BulkSelectAll";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { parsePrivateSellerDescription } from "@/lib/privateSeller";
import { extractDealerCode } from "@/lib/dealerCode";
import {
  extractDealerSubmittedPrice,
  isListingPendingApproval,
} from "@/lib/listingApproval";

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
  description?: string | null;
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

const formatPercent = (value?: number | null) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
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
  if (filters.status && filters.status !== "pending") {
    query = query.eq("status", filters.status);
  }
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

  const [{ data, error }, pendingRowsResponse] = await Promise.all([
    query.limit(2000),
    sb
      .from("listings")
      .select("id, status, description")
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);
  const listings = (data ?? []) as ListingRow[];
  const pendingCount = ((pendingRowsResponse.data ?? []) as ListingRow[]).filter((listing) =>
    isListingPendingApproval(listing)
  ).length;
  const visibleListings =
    filters.status === "pending"
      ? listings.filter((listing) => isListingPendingApproval(listing))
      : listings;
  const pendingVisibleCount = visibleListings.filter((listing) =>
    isListingPendingApproval(listing)
  ).length;

  const dealerIds = Array.from(
    new Set(visibleListings.map((listing) => listing.dealer_id).filter(Boolean))
  ) as string[];
  const dealerMap = new Map<string, { name: string; code: string | null }>();
  if (dealerIds.length > 0) {
    const { data: dealerRows } = await sb
      .from("dealers")
      .select("id, name, description")
      .in("id", dealerIds);
    for (const dealer of (dealerRows ?? []) as DealerLite[]) {
      dealerMap.set(dealer.id, {
        name: dealer.name ?? "Dealer",
        code: extractDealerCode(dealer.description),
      });
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
  const pendingPath = buildQueryPath("/admin/listings", {
    q: filters.q || null,
    status: "pending",
    type: filters.type || null,
    owner: filters.owner || null,
    sort: filters.sort || null,
    dealer_id: filters.dealerId || null,
  });
  const bulkFormId = "bulk-approve-form";

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
        {action === "listing_approved" && (
          <div className="admin-banner">Listing approved successfully.</div>
        )}
        {pendingCount > 0 && filters.status !== "pending" && (
          <div className="admin-banner">
            {pendingCount} listings are waiting for approval.{" "}
            <Link className="link" href={pendingPath}>
              Show pending
            </Link>
          </div>
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
              <option value="pending">Pending approval</option>
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

        <form
          id={bulkFormId}
          className="admin-bulk-form"
          method="post"
          action="/api/admin/listings/bulk-approve"
        >
          <input type="hidden" name="return" value={returnPath} />
          <div className="admin-bulk-actions">
            <div>
              <strong>Bulk approve pending</strong>
              <p>Select pending listings below to publish them.</p>
              {pendingVisibleCount === 0 && (
                <p className="notification-meta">
                  No pending listings in this view.{" "}
                  <Link className="link" href={pendingPath}>
                    View pending approvals
                  </Link>
                </p>
              )}
            </div>
            <div className="admin-bulk-actions__controls">
              <input name="price" placeholder="Set one selling price (optional)" />
              <label className="admin-row-approve__check">
                <input type="checkbox" name="contact_for_price" />
                Contact for price
              </label>
              <button
                className="btn btn--solid"
                type="submit"
                disabled={pendingVisibleCount === 0}
              >
                Approve selected
              </button>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>
                    <BulkSelectAll
                      formId={bulkFormId}
                      name="ids"
                      disabled={pendingVisibleCount === 0}
                    />
                  </th>
                  <th>Car</th>
                  <th>Owner</th>
                  <th>Net price</th>
                  <th>Status</th>
                  <th>Selling price</th>
                  <th>Profit %</th>
                  <th>Location</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleListings.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="empty">
                      No listings found.
                    </td>
                  </tr>
                ) : (
                  visibleListings.map((listing) => {
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
                    const dealerInfo = listing.dealer_id
                      ? dealerMap.get(listing.dealer_id) ?? {
                          name: "Dealer",
                          code: null,
                        }
                      : null;
                    const ownerLabel = listing.dealer_id
                      ? dealerInfo?.name ?? "Dealer"
                      : privateSeller.seller.name || "Private seller";
                    const ownerType = listing.dealer_id ? "Dealer" : "Private";
                    const isPending = isListingPendingApproval(listing);
                    const netPrice =
                      extractDealerSubmittedPrice(listing.description) ??
                      (isPending ? listing.price : null);
                    const profit =
                      netPrice && listing.price
                        ? listing.price - netPrice
                        : null;
                    const profitPercent =
                      netPrice && listing.price && netPrice > 0
                        ? ((listing.price - netPrice) / netPrice) * 100
                        : null;

                    return (
                      <tr key={listing.id}>
                        <td>
                          {isPending ? (
                            <input
                              type="checkbox"
                              name="ids"
                              value={listing.id}
                              title="Select pending listing"
                            />
                          ) : (
                            <span
                              className="notification-meta"
                              title="Only pending listings can be selected"
                            >
                              —
                            </span>
                          )}
                        </td>
                        <td>
                          <div>{title || "Listing"}</div>
                          <div className="notification-meta">{toTitle(listing.type)}</div>
                        </td>
                        <td>
                          <div>{ownerLabel}</div>
                          <div className="notification-meta">
                            {ownerType}
                            {dealerInfo?.code ? ` • ID ${dealerInfo.code}` : ""}
                          </div>
                        </td>
                        <td>
                          <div>{formatPrice(netPrice)}</div>
                          <div className="notification-meta">
                            {listing.dealer_id ? "Dealer price" : "Seller price"}
                          </div>
                        </td>
                        <td>
                          <span className="status-badge">
                            {isPending ? "Pending" : toTitle(listing.status)}
                          </span>
                        </td>
                        <td>
                          <div>{formatPrice(listing.price)}</div>
                          {netPrice ? (
                            <div className="notification-meta">
                              {profit ? `Profit: ${formatPrice(profit)}` : "Selling price"}
                            </div>
                          ) : null}
                        </td>
                        <td>
                          <div>{formatPercent(profitPercent)}</div>
                          {profit !== null ? (
                            <div className="notification-meta">{formatPrice(profit)}</div>
                          ) : null}
                        </td>
                        <td>{listing.location || "—"}</td>
                        <td>{formatDate(listing.created_at || listing.last_seen_at)}</td>
                        <td>
                          <div className="admin-row-actions">
                            <Link className="link" href={`/listing/${listing.id}`}>
                              View
                            </Link>
                            <Link className="link" href={`/admin/listings/${listing.id}`}>
                              Edit
                            </Link>
                            <Link className="link" href={`/admin/instagram/${listing.id}`}>
                              Post to Instagram
                            </Link>
                            {isPending && (
                              <form
                                method="post"
                                action={`/api/admin/listings/${listing.id}/approve`}
                                className="admin-row-approve"
                              >
                                <input type="hidden" name="return" value={returnPath} />
                                <input
                                  name="price"
                                  placeholder="Set selling price"
                                  defaultValue={listing.price ?? ""}
                                />
                                <label className="admin-row-approve__check">
                                  <input type="checkbox" name="contact_for_price" />
                                  Contact for price
                                </label>
                                <button className="btn btn--solid" type="submit">
                                  Approve & set selling price
                                </button>
                              </form>
                            )}
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
        </form>
      </section>
    </main>
  );
}
