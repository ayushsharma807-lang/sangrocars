import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

type DealerRow = Record<string, unknown>;
type ListingRow = {
  dealer_id?: string | null;
  status?: string | null;
  last_seen_at?: string | null;
  created_at?: string | null;
};

type SearchParams = {
  q?: string | string[];
  inventory?: string | string[];
  feed?: string | string[];
  sort?: string | string[];
  action?: string | string[];
  error?: string | string[];
};

type DealerSummary = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  address: string | null;
  createdAt: string | null;
  feedConfigured: boolean;
  liveListings: number;
  totalListings: number;
  lastListingActivityAt: string | null;
};

const getParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

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

const toString = (value: unknown) => {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
};

const getDealerField = (dealer: DealerRow, keys: string[]) => {
  for (const key of keys) {
    const value = toString(dealer[key]);
    if (value) return value;
  }
  return null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const isTruthyUrl = (value?: string | null) => {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://");
};

const buildDealerSummaries = (dealers: DealerRow[], listings: ListingRow[]) => {
  const listingMap = new Map<
    string,
    { live: number; total: number; latestTs: number | null }
  >();

  for (const listing of listings) {
    const dealerId = toString(listing.dealer_id);
    if (!dealerId) continue;

    const bucket = listingMap.get(dealerId) ?? { live: 0, total: 0, latestTs: null };
    bucket.total += 1;
    if (String(listing.status ?? "").toLowerCase() === "available") {
      bucket.live += 1;
    }

    const lastActivity = listing.last_seen_at || listing.created_at;
    if (lastActivity) {
      const ts = new Date(lastActivity).getTime();
      if (Number.isFinite(ts)) {
        bucket.latestTs = bucket.latestTs === null ? ts : Math.max(bucket.latestTs, ts);
      }
    }
    listingMap.set(dealerId, bucket);
  }

  return dealers.map((dealer) => {
    const id = getDealerField(dealer, ["id"]) ?? "";
    const name =
      getDealerField(dealer, ["name", "dealer_name", "company_name"]) ??
      "Dealer";
    const email = getDealerField(dealer, ["email", "owner_email", "contact_email"]);
    const phone = getDealerField(dealer, ["phone", "whatsapp", "mobile"]);
    const address = getDealerField(dealer, ["address", "location"]);
    const city = address?.split(",")[0]?.trim() || null;
    const createdAt = getDealerField(dealer, ["created_at"]);
    const feedConfigured =
      isTruthyUrl(getDealerField(dealer, ["feed_url"])) ||
      isTruthyUrl(getDealerField(dealer, ["inventory_url"])) ||
      isTruthyUrl(getDealerField(dealer, ["sitemap_url"])) ||
      isTruthyUrl(getDealerField(dealer, ["scrape_url"])) ||
      isTruthyUrl(getDealerField(dealer, ["website_url"]));
    const listingInfo = listingMap.get(id) ?? {
      live: 0,
      total: 0,
      latestTs: null,
    };

    return {
      id,
      name,
      email,
      phone,
      city,
      address,
      createdAt,
      feedConfigured,
      liveListings: listingInfo.live,
      totalListings: listingInfo.total,
      lastListingActivityAt: listingInfo.latestTs
        ? new Date(listingInfo.latestTs).toISOString()
        : null,
    } as DealerSummary;
  });
};

const filterSummaries = (
  summaries: DealerSummary[],
  filters: { q: string; inventory: string; feed: string; sort: string }
) => {
  let filtered = summaries;

  const q = filters.q.trim().toLowerCase();
  if (q) {
    filtered = filtered.filter((dealer) =>
      [dealer.name, dealer.email, dealer.phone, dealer.city, dealer.address]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  if (filters.inventory === "yes") {
    filtered = filtered.filter((dealer) => dealer.liveListings > 0);
  } else if (filters.inventory === "no") {
    filtered = filtered.filter((dealer) => dealer.liveListings === 0);
  }

  if (filters.feed === "yes") {
    filtered = filtered.filter((dealer) => dealer.feedConfigured);
  } else if (filters.feed === "no") {
    filtered = filtered.filter((dealer) => !dealer.feedConfigured);
  }

  switch (filters.sort) {
    case "name":
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "live_desc":
      filtered = filtered.sort((a, b) => b.liveListings - a.liveListings);
      break;
    default:
      filtered = filtered.sort((a, b) => {
        const aTs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTs - aTs;
      });
      break;
  }

  return filtered;
};

const getDealerTopStats = (summaries: DealerSummary[]) => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const totalDealers = summaries.length;
  const new7d = summaries.filter((dealer) => {
    if (!dealer.createdAt) return false;
    const ts = new Date(dealer.createdAt).getTime();
    return Number.isFinite(ts) && ts >= sevenDaysAgo;
  }).length;
  const dealersWithLiveCars = summaries.filter(
    (dealer) => dealer.liveListings > 0
  ).length;
  const dealersWithFeed = summaries.filter((dealer) => dealer.feedConfigured).length;
  return { totalDealers, new7d, dealersWithLiveCars, dealersWithFeed };
};

export default async function AdminDealersPage({
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
    q: getParam(params.q) ?? "",
    inventory: getParam(params.inventory) ?? "",
    feed: getParam(params.feed) ?? "",
    sort: getParam(params.sort) ?? "created_desc",
  };
  const action = getParam(params.action) ?? "";
  const errorText = getParam(params.error) ?? "";

  const sb = supabaseServer();
  const [dealersRes, listingsRes] = await Promise.all([
    sb.from("dealers").select("*").limit(5000),
    sb
      .from("listings")
      .select("dealer_id, status, last_seen_at, created_at")
      .limit(20000),
  ]);

  const error = dealersRes.error || listingsRes.error;
  const summaries = buildDealerSummaries(
    (dealersRes.data ?? []) as DealerRow[],
    (listingsRes.data ?? []) as ListingRow[]
  );
  const visibleDealers = filterSummaries(summaries, filters);
  const { totalDealers, new7d, dealersWithLiveCars, dealersWithFeed } =
    getDealerTopStats(summaries);
  const returnPath = buildQueryPath("/admin/dealers", {
    q: filters.q || null,
    inventory: filters.inventory || null,
    feed: filters.feed || null,
    sort: filters.sort || null,
  });

  return (
    <main className="home">
      <section className="section admin">
        <div className="section__header">
          <div>
            <h2>Dealer accounts</h2>
            <p>Track dealer signups and inventory activity.</p>
          </div>
          <div className="dealer__actions">
            <form method="post" action="/api/admin/logout">
              <button className="btn btn--ghost" type="submit">
                Log out
              </button>
            </form>
            <Link className="btn btn--outline" href="#export">
              Export CSV
            </Link>
            <Link className="btn btn--outline" href="/admin/leads">
              Lead inbox
            </Link>
            <Link className="btn btn--outline" href="/admin/exclusive-deals">
              Exclusive deals
            </Link>
            <Link className="btn btn--outline" href="/admin/listings">
              Ads
            </Link>
            <Link className="btn btn--outline" href="/admin/listings/new">
              Post car
            </Link>
            <Link className="btn btn--solid" href="/">
              Back to home
            </Link>
          </div>
        </div>

        {error && (
          <div className="admin-banner admin-banner--error">
            Failed to load dealer data: {error.message}
          </div>
        )}
        {action === "dealer_deleted" && (
          <div className="admin-banner">Dealer account deleted successfully.</div>
        )}
        {errorText && (
          <div className="admin-banner admin-banner--error">
            {decodeURIComponent(errorText)}
          </div>
        )}

        <div className="admin-notifications">
          <div className="notification-card">
            <h3>Total dealers</h3>
            <p className="notification-value">{totalDealers}</p>
            <p className="notification-meta">All registered dealer accounts</p>
          </div>
          <div className="notification-card">
            <h3>New in last 7 days</h3>
            <p className="notification-value">{new7d}</p>
            <p className="notification-meta">Fresh signups this week</p>
          </div>
          <div className="notification-card">
            <h3>Inventory active</h3>
            <p className="notification-value">{dealersWithLiveCars}</p>
            <p className="notification-meta">Dealers with available listings</p>
          </div>
          <div className="notification-card">
            <h3>Feed configured</h3>
            <p className="notification-value">{dealersWithFeed}</p>
            <p className="notification-meta">Auto-sync sources connected</p>
          </div>
        </div>

        <form className="admin-filter" method="get">
          <label>
            Search
            <input
              name="q"
              placeholder="Dealer name, email, phone, city"
              defaultValue={filters.q}
            />
          </label>
          <label>
            Live inventory
            <select name="inventory" defaultValue={filters.inventory}>
              <option value="">All</option>
              <option value="yes">Has live cars</option>
              <option value="no">No live cars</option>
            </select>
          </label>
          <label>
            Feed setup
            <select name="feed" defaultValue={filters.feed}>
              <option value="">All</option>
              <option value="yes">Configured</option>
              <option value="no">Not configured</option>
            </select>
          </label>
          <label>
            Sort
            <select name="sort" defaultValue={filters.sort}>
              <option value="created_desc">Newest first</option>
              <option value="name">Name A-Z</option>
              <option value="live_desc">Most live cars</option>
            </select>
          </label>
          <button className="btn btn--solid" type="submit">
            Apply filters
          </button>
          <Link className="btn btn--ghost" href="/admin/dealers">
            Clear
          </Link>
        </form>

        <form
          className="export-form"
          method="get"
          action="/api/admin/dealers/export"
          id="export"
        >
          {filters.q && <input type="hidden" name="q" value={filters.q} />}
          {filters.inventory && (
            <input type="hidden" name="inventory" value={filters.inventory} />
          )}
          {filters.feed && <input type="hidden" name="feed" value={filters.feed} />}
          {filters.sort && <input type="hidden" name="sort" value={filters.sort} />}
          <div className="export-header">
            <div>
              <h3>Export dealer CSV</h3>
              <p>Downloads dealer accounts with listing and feed status.</p>
            </div>
            <button className="btn btn--outline" type="submit">
              Download CSV
            </button>
          </div>
        </form>

        <div className="table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Dealer</th>
                <th>Contact</th>
                <th>City</th>
                <th>Live cars</th>
                <th>Total listings</th>
                <th>Feed</th>
                <th>Joined</th>
                <th>Last listing activity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleDealers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty">
                    No dealers found for these filters.
                  </td>
                </tr>
              ) : (
                visibleDealers.map((dealer) => (
                  <tr key={dealer.id}>
                    <td>
                      <strong>{dealer.name}</strong>
                      <div className="notification-meta">
                        ID: {dealer.id.slice(0, 8)}
                      </div>
                    </td>
                    <td>
                      <div>{dealer.email || "—"}</div>
                      <div>{dealer.phone || "—"}</div>
                    </td>
                    <td>{dealer.city || "—"}</td>
                    <td>
                      <span className="status-badge">{dealer.liveListings}</span>
                    </td>
                    <td>{dealer.totalListings}</td>
                    <td>
                      <span className="status-badge">
                        {dealer.feedConfigured ? "Connected" : "Not set"}
                      </span>
                    </td>
                    <td>{formatDate(dealer.createdAt)}</td>
                    <td>{formatDate(dealer.lastListingActivityAt)}</td>
                    <td>
                      <div className="admin-row-actions">
                        <Link className="link" href={`/dealer/${dealer.id}`}>
                          Public page
                        </Link>
                        <Link
                          className="link"
                          href={`/admin/listings?dealer_id=${dealer.id}`}
                        >
                          View ads
                        </Link>
                        <form
                          method="post"
                          action={`/api/admin/dealers/${dealer.id}/delete`}
                        >
                          <input type="hidden" name="return" value={returnPath} />
                          <button className="btn btn--ghost" type="submit">
                            Delete dealer
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
