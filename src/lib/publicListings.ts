import { extractDealerCode } from "@/lib/dealerCode";
import { hasSupabaseConfig, supabaseServerOptional } from "@/lib/supabase";

export type ListingsSearchParams = {
  q?: string | string[];
  min_price?: string | string[];
  max_price?: string | string[];
  price_mode?: string | string[];
  fuel?: string | string[];
  transmission?: string | string[];
  type?: string | string[];
  year_min?: string | string[];
  year_max?: string | string[];
  city?: string | string[];
  location?: string | string[];
  budget?: string | string[];
  dealer_id?: string | string[];
  verified?: string | string[];
  sort?: string | string[];
  compare?: string | string[];
  offset?: string | string[];
  limit?: string | string[];
};

export type PublicListing = {
  id: string;
  dealer_id: string | null;
  make: string | null;
  model: string | null;
  variant: string | null;
  year: number | null;
  price: number | null;
  km: number | null;
  fuel: string | null;
  transmission: string | null;
  location: string | null;
  description: string | null;
  photo_urls: string[] | null;
  stock_id: string | null;
  created_at: string | null;
  dealer_code?: string | null;
  dealer_count?: number | null;
};

export const PAGE_SIZE = 9;

export const getParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

export const parseMoney = (value?: string) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  const hasLakh = normalized.includes("l");
  const hasCr = normalized.includes("cr");
  const hasK = normalized.includes("k");
  const cleaned = normalized.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  if (hasCr) return Math.round(num * 10_000_000);
  if (hasLakh) return Math.round(num * 100_000);
  if (hasK) return Math.round(num * 1_000);
  return Math.round(num);
};

export const parseNumber = (value?: string) => {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const parseBudgetRange = (value?: string | null) => {
  if (!value) return null;
  const [minRaw, maxRaw] = value.split("-").map((part) => Number(part));
  if (!Number.isFinite(minRaw) || !Number.isFinite(maxRaw)) return null;
  return { min: minRaw, max: maxRaw };
};

export const fetchPublicListingsPage = async (
  searchParams: ListingsSearchParams,
  options?: {
    offset?: number;
    limit?: number;
    includeCount?: boolean;
  }
) => {
  const offset = Math.max(
    0,
    options?.offset ??
      (Number(getParam(searchParams.offset) ?? 0) || 0)
  );
  const limit = Math.max(
    1,
    options?.limit ??
      (Number(getParam(searchParams.limit) ?? PAGE_SIZE) || PAGE_SIZE)
  );
  const includeCount = options?.includeCount ?? false;

  if (!hasSupabaseConfig()) {
    return {
      listings: [] as PublicListing[],
      count: 0,
      error: "supabase_not_configured",
      offset,
      limit,
      hasMore: false,
    };
  }

  const sb = supabaseServerOptional();
  if (!sb) {
    return {
      listings: [] as PublicListing[],
      count: 0,
      error: "supabase_not_configured",
      offset,
      limit,
      hasMore: false,
    };
  }

  let query = sb
    .from("listings")
    .select(
      "id, dealer_id, make, model, variant, year, price, km, fuel, transmission, location, description, photo_urls, stock_id, created_at",
      includeCount ? { count: "exact" } : undefined
    )
    .eq("status", "available");

  const q = getParam(searchParams.q)?.replace(/,/g, " ").trim();
  if (q) {
    query = query.or(`make.ilike.%${q}%,model.ilike.%${q}%,variant.ilike.%${q}%`);
  }

  const priceMode = getParam(searchParams.price_mode);
  const budgetValue = getParam(searchParams.budget);
  if (budgetValue && priceMode !== "custom") {
    const range = parseBudgetRange(budgetValue);
    if (range) {
      query = query.gte("price", range.min).lte("price", range.max);
    }
  }
  if (priceMode === "custom") {
    const minPrice = parseMoney(getParam(searchParams.min_price));
    const maxPrice = parseMoney(getParam(searchParams.max_price));
    if (minPrice !== null) query = query.gte("price", minPrice);
    if (maxPrice !== null) query = query.lte("price", maxPrice);
  }

  const fuel = getParam(searchParams.fuel)?.trim();
  if (fuel) query = query.ilike("fuel", `%${fuel}%`);

  const transmission = getParam(searchParams.transmission)?.trim();
  if (transmission) query = query.ilike("transmission", `%${transmission}%`);

  const type = getParam(searchParams.type)?.trim();
  if (type) query = query.eq("type", type);

  const yearMin = parseNumber(getParam(searchParams.year_min));
  const yearMax = parseNumber(getParam(searchParams.year_max));
  if (yearMin !== null) query = query.gte("year", yearMin);
  if (yearMax !== null) query = query.lte("year", yearMax);

  const city = getParam(searchParams.city)?.trim();
  if (city) query = query.ilike("location", `%${city}%`);

  const location = getParam(searchParams.location)?.trim();
  if (location) query = query.ilike("location", `%${location}%`);

  const dealerId = getParam(searchParams.dealer_id)?.trim();
  if (dealerId) query = query.eq("dealer_id", dealerId);

  const verified = getParam(searchParams.verified);
  if (verified === "1") query = query.not("dealer_id", "is", null);

  const sort = getParam(searchParams.sort) ?? "recent";
  switch (sort) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "year_desc":
      query = query.order("year", { ascending: false });
      break;
    case "year_asc":
      query = query.order("year", { ascending: true });
      break;
    default:
      query = query.order("last_seen_at", { ascending: false });
      break;
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return {
      listings: [] as PublicListing[],
      count: 0,
      error: error.message,
      offset,
      limit,
      hasMore: false,
    };
  }

  const listings = (data ?? []) as PublicListing[];
  const totalCount = includeCount ? count ?? listings.length : 0;

  return {
    listings,
    count: totalCount,
    error: null,
    offset,
    limit,
    hasMore: includeCount ? offset + listings.length < totalCount : listings.length === limit,
  };
};

export const attachDealerMeta = async (listings: PublicListing[]) => {
  if (listings.length === 0 || !hasSupabaseConfig()) {
    return listings.map((listing) => ({
      ...listing,
      dealer_code: null,
      dealer_count: listing.dealer_id ? 0 : null,
    }));
  }

  const sb = supabaseServerOptional();
  if (!sb) {
    return listings.map((listing) => ({
      ...listing,
      dealer_code: null,
      dealer_count: listing.dealer_id ? 0 : null,
    }));
  }

  const dealerIds = Array.from(
    new Set(
      listings
        .map((listing) => listing.dealer_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (dealerIds.length === 0) {
    return listings.map((listing) => ({
      ...listing,
      dealer_code: null,
      dealer_count: null,
    }));
  }

  const dealerMap = new Map<string, string | null>();
  const dealerCounts = new Map<string, number>();

  const [{ data: dealerRows }, { data: countRows }] = await Promise.all([
    sb.from("dealers").select("id, description").in("id", dealerIds),
    sb
      .from("listings")
      .select("dealer_id")
      .eq("status", "available")
      .in("dealer_id", dealerIds),
  ]);

  for (const row of (dealerRows ?? []) as Record<string, unknown>[]) {
    const id = String(row.id ?? "");
    if (!id) continue;
    dealerMap.set(id, extractDealerCode((row.description ?? null) as string | null));
  }

  for (const row of (countRows ?? []) as { dealer_id?: string | null }[]) {
    const id = row.dealer_id;
    if (!id) continue;
    dealerCounts.set(id, (dealerCounts.get(id) ?? 0) + 1);
  }

  return listings.map((listing) => ({
    ...listing,
    dealer_code: listing.dealer_id ? dealerMap.get(listing.dealer_id) ?? null : null,
    dealer_count: listing.dealer_id ? dealerCounts.get(listing.dealer_id) ?? 0 : null,
  }));
};
