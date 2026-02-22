import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

type DealerRow = Record<string, unknown>;
type ListingRow = {
  dealer_id?: string | null;
  status?: string | null;
  last_seen_at?: string | null;
  created_at?: string | null;
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

const csvEscape = (value: unknown) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const buildCsv = (rows: Record<string, unknown>[], columns: string[]) => {
  const header = columns.join(",");
  const body = rows.map((row) =>
    columns.map((col) => csvEscape(row[col])).join(",")
  );
  return [header, ...body].join("\n");
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

export async function GET(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const filters = {
    q: searchParams.get("q")?.trim() ?? "",
    inventory: searchParams.get("inventory")?.trim() ?? "",
    feed: searchParams.get("feed")?.trim() ?? "",
    sort: searchParams.get("sort")?.trim() ?? "created_desc",
  };

  const sb = supabaseServer();
  const [dealersRes, listingsRes] = await Promise.all([
    sb.from("dealers").select("*").limit(5000),
    sb
      .from("listings")
      .select("dealer_id, status, last_seen_at, created_at")
      .limit(20000),
  ]);

  if (dealersRes.error || listingsRes.error) {
    return NextResponse.json(
      { ok: false, error: dealersRes.error?.message || listingsRes.error?.message },
      { status: 500 }
    );
  }

  const summaries = buildDealerSummaries(
    (dealersRes.data ?? []) as DealerRow[],
    (listingsRes.data ?? []) as ListingRow[]
  );
  const rows = filterSummaries(summaries, filters).map((dealer) => ({
    id: dealer.id,
    name: dealer.name,
    email: dealer.email,
    phone: dealer.phone,
    city: dealer.city,
    address: dealer.address,
    live_listings: dealer.liveListings,
    total_listings: dealer.totalListings,
    feed_configured: dealer.feedConfigured ? "yes" : "no",
    joined_at: dealer.createdAt,
    last_listing_activity_at: dealer.lastListingActivityAt,
    public_page: dealer.id ? `/dealer/${dealer.id}` : "",
  }));

  const columns = [
    "id",
    "name",
    "email",
    "phone",
    "city",
    "address",
    "live_listings",
    "total_listings",
    "feed_configured",
    "joined_at",
    "last_listing_activity_at",
    "public_page",
  ];
  const csv = buildCsv(rows, columns);
  const filename = `dealers-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
