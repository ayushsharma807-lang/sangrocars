import Image from "next/image";
import Link from "next/link";
import SortForm from "@/app/components/SortForm";
import PriceRangeSlider from "@/app/components/PriceRangeSlider";
import { hasSupabaseConfig, supabaseServerOptional } from "@/lib/supabase";
import { getPrimaryPhoto } from "@/lib/photoUrls";
import { extractDealerCode } from "@/lib/dealerCode";

type SearchParams = {
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
  page?: string | string[];
  compare?: string | string[];
};

const buildWhatsAppLink = () => {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const message =
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ??
    "Hi, I'm interested in a car listing on SangroCars.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};


const getSupportPhone = () => {
  const raw = process.env.NEXT_PUBLIC_SUPPORT_PHONE ??
    process.env.NEXT_PUBLIC_SANGRO_PHONE ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const digits = raw.replace(/\D/g, "");
  return digits || null;
};

const buildSupportWhatsApp = () => {
  const digits = getSupportPhone();
  if (!digits) return "";
  const message = process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ??
    "Hi, I'm interested in a car listing on SangroCars.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

type Listing = {
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
};

type DealerOption = {
  id: string;
  code: string | null;
};

const PAGE_SIZE = 9;
const DEFAULT_PRICE_MIN = 100_000;
const DEFAULT_PRICE_MAX = 5_000_000;
const BUDGET_OPTIONS = [
  { value: "", label: "Budget" },
  { value: "0-300000", label: "Up to ₹3L" },
  { value: "300000-600000", label: "₹3L - ₹6L" },
  { value: "600000-1000000", label: "₹6L - ₹10L" },
  { value: "1000000-2000000", label: "₹10L - ₹20L" },
  { value: "2000000-5000000", label: "₹20L - ₹50L" },
  { value: "5000000-20000000", label: "₹50L+" },
];
const POPULAR_SEARCHES = ["Swift", "Thar", "Creta", "Fortuner"];

const publicDealerLabel = (code?: string | null) =>
  code ? `Dealer ID ${code}` : "Verified dealer";

const parseMoney = (value?: string) => {
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

const parseNumber = (value?: string) => {
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

const getBudgetLabel = (value?: string | null) => {
  if (!value) return null;
  return BUDGET_OPTIONS.find((option) => option.value === value)?.label ?? null;
};

const getParam = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const parseCompareIds = (value?: string | string[]) => {
  const raw = getParam(value);
  if (!raw) return [] as string[];
  const unique = Array.from(
    new Set(
      raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
  return unique.slice(0, 3);
};

const buildQuery = (
  searchParams: SearchParams,
  overrides: Record<string, string | null>
) => {
  const params = new URLSearchParams();
  const entries: Record<string, string | undefined> = {
    q: getParam(searchParams.q),
    min_price: getParam(searchParams.min_price),
    max_price: getParam(searchParams.max_price),
    price_mode: getParam(searchParams.price_mode),
    fuel: getParam(searchParams.fuel),
    transmission: getParam(searchParams.transmission),
    type: getParam(searchParams.type),
    year_min: getParam(searchParams.year_min),
    year_max: getParam(searchParams.year_max),
    city: getParam(searchParams.city),
    location: getParam(searchParams.location),
    dealer_id: getParam(searchParams.dealer_id),
    verified: getParam(searchParams.verified),
    sort: getParam(searchParams.sort),
    page: getParam(searchParams.page),
    compare: getParam(searchParams.compare),
  };

  for (const [key, value] of Object.entries(entries)) {
    const override = overrides[key];
    const finalValue =
      override === undefined ? value : override === null ? "" : override;
    if (finalValue) params.set(key, finalValue);
  }

  return params.toString();
};

const formatPrice = (value: number | null) => {
  if (!value) return "Price on request";
  return `₹${value.toLocaleString("en-IN")}`;
};

const isLuxuryListing = (price?: number | null) => (price ?? 0) >= 4_500_000;

const estimateEmi = (value: number | null) => {
  if (!value) return null;
  const monthly = Math.round(value * 0.019);
  return `EMI from ₹${monthly.toLocaleString("en-IN")}/mo`;
};

const formatFilterLabel = (label: string, value: string) => `${label}: ${value}`;

const getSortLabel = (value?: string | null) => {
  switch (value) {
    case "price_asc":
      return "Price: Low to High";
    case "price_desc":
      return "Price: High to Low";
    case "year_desc":
      return "Year: Newest";
    case "year_asc":
      return "Year: Oldest";
    default:
      return "Newest";
  }
};

const toTitle = (value: string | null) => {
  if (!value) return null;
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getCityFromLocation = (value?: string | null) => {
  if (!value) return null;
  const city = value.split(",")[0]?.trim();
  return city || null;
};

const getCityOptions = async () => {
  if (!hasSupabaseConfig()) return [] as string[];
  const sb = supabaseServerOptional();
  if (!sb) return [] as string[];
  const { data, error } = await sb
    .from("listings")
    .select("location")
    .eq("status", "available")
    .not("location", "is", null)
    .limit(5000);

  if (error) return [] as string[];

  const set = new Set<string>();
  for (const row of (data ?? []) as { location?: string | null }[]) {
    const city = getCityFromLocation(row.location);
    if (city) set.add(city);
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

const getDealerOptions = async () => {
  if (!hasSupabaseConfig()) return [] as DealerOption[];
  const sb = supabaseServerOptional();
  if (!sb) return [] as DealerOption[];
  const { data, error } = await sb
    .from("dealers")
    .select("id, description")
    .limit(4000);
  if (error || !data) return [] as DealerOption[];
  return (data as Record<string, unknown>[])
    .map((row) => ({
      id: String(row.id ?? ""),
      code: extractDealerCode((row.description ?? null) as string | null),
    }))
    .filter((dealer) => dealer.id)
    .sort((a, b) => (a.code ?? "").localeCompare(b.code ?? ""));
};

const getPriceBounds = async () => {
  if (!hasSupabaseConfig()) {
    return { min: DEFAULT_PRICE_MIN, max: DEFAULT_PRICE_MAX };
  }
  const sb = supabaseServerOptional();
  if (!sb) {
    return { min: DEFAULT_PRICE_MIN, max: DEFAULT_PRICE_MAX };
  }
  const [minRes, maxRes] = await Promise.all([
    sb
      .from("listings")
      .select("price")
      .eq("status", "available")
      .not("price", "is", null)
      .order("price", { ascending: true })
      .limit(1)
      .maybeSingle(),
    sb
      .from("listings")
      .select("price")
      .eq("status", "available")
      .not("price", "is", null)
      .order("price", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const min = Number(minRes.data?.price ?? DEFAULT_PRICE_MIN);
  const max = Number(maxRes.data?.price ?? DEFAULT_PRICE_MAX);

  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    return { min: DEFAULT_PRICE_MIN, max: DEFAULT_PRICE_MAX };
  }

  return { min, max };
};

const getListings = async (searchParams: SearchParams) => {
  const pageRaw = getParam(searchParams.page);
  const page = Math.max(1, Number(pageRaw ?? 1) || 1);
  if (!hasSupabaseConfig()) {
    return { listings: [] as Listing[], count: 0, error: "supabase_not_configured", page };
  }
  const sb = supabaseServerOptional();
  if (!sb) {
    return { listings: [] as Listing[], count: 0, error: "supabase_not_configured", page };
  }
  let query = sb
    .from("listings")
    .select(
      "id, dealer_id, make, model, variant, year, price, km, fuel, transmission, location, description, photo_urls, stock_id",
      { count: "exact" }
    )
    .eq("status", "available");

  const q = getParam(searchParams.q)?.replace(/,/g, " ").trim();
  if (q) {
    query = query.or(
      `make.ilike.%${q}%,model.ilike.%${q}%,variant.ilike.%${q}%`
    );
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

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await query.range(from, to);
  if (error) {
    return { listings: [] as Listing[], count: 0, error: error.message, page };
  }
  return {
    listings: (data ?? []) as Listing[],
    count: count ?? 0,
    error: null,
    page,
  };
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const whatsappHref = buildSupportWhatsApp();
  const params = await searchParams;
  const [{ listings, count, error, page }, cities, priceBounds, dealers] =
    await Promise.all([
      getListings(params),
      getCityOptions(),
      getPriceBounds(),
      getDealerOptions(),
    ]);
  const qValue = getParam(params.q);
  const minPriceValue = getParam(params.min_price);
  const maxPriceValue = getParam(params.max_price);
  const priceModeValue = getParam(params.price_mode) ?? "any";
  const yearMinValue = getParam(params.year_min);
  const yearMaxValue = getParam(params.year_max);
  const fuelValue = getParam(params.fuel);
  const cityValue = getParam(params.city);
  const budgetValue = getParam(params.budget);
  const dealerIdValue = getParam(params.dealer_id);
  const verifiedValue = getParam(params.verified);
  const locationValue = getParam(params.location);
  const transmissionValue = getParam(params.transmission);
  const typeValue = getParam(params.type);
  const sortValue = getParam(params.sort) ?? "recent";
  const compareIds = parseCompareIds(params.compare);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const dealerMap = new Map<string, DealerOption>();
  const dealerCounts = new Map<string, number>();
  const dealerIds = Array.from(
    new Set(
      listings
        .map((listing) => listing.dealer_id)
        .filter((id): id is string => Boolean(id))
    )
  );
  if (dealerIds.length > 0 && hasSupabaseConfig()) {
    const sb = supabaseServerOptional();
    if (sb) {
      const { data: dealerRows } = await sb
        .from("dealers")
        .select("id, description")
        .in("id", dealerIds);
      for (const row of (dealerRows ?? []) as Record<string, unknown>[]) {
        const id = String(row.id ?? "");
        if (!id) continue;
        dealerMap.set(id, {
          id,
          code: extractDealerCode((row.description ?? null) as string | null),
        });
      }

      const { data: countRows } = await sb
        .from("listings")
        .select("dealer_id")
        .eq("status", "available")
        .in("dealer_id", dealerIds);
      for (const row of (countRows ?? []) as { dealer_id?: string | null }[]) {
        const id = row.dealer_id;
        if (!id) continue;
        dealerCounts.set(id, (dealerCounts.get(id) ?? 0) + 1);
      }
    }
  }
  const recentListings = listings.slice(0, 4);
  const featuredListings =
    listings.length > 4 ? listings.slice(4, 8) : listings.slice(0, 4);
  const preservedParams = {
    q: qValue,
    min_price: minPriceValue,
    max_price: maxPriceValue,
    price_mode: priceModeValue === "custom" ? priceModeValue : undefined,
    fuel: fuelValue,
    transmission: transmissionValue,
    type: typeValue,
    year_min: yearMinValue,
    year_max: yearMaxValue,
    city: cityValue,
    location: locationValue,
    budget: budgetValue,
    dealer_id: dealerIdValue,
    verified: verifiedValue,
    compare: compareIds.length > 0 ? compareIds.join(",") : undefined,
  };
  const topSearchHiddenEntries = [
    { key: "min_price", value: minPriceValue },
    { key: "max_price", value: maxPriceValue },
    {
      key: "price_mode",
      value: priceModeValue === "custom" ? priceModeValue : undefined,
    },
    { key: "fuel", value: fuelValue },
    { key: "transmission", value: transmissionValue },
    { key: "type", value: typeValue },
    { key: "year_min", value: yearMinValue },
    { key: "year_max", value: yearMaxValue },
    { key: "location", value: locationValue },
    { key: "dealer_id", value: dealerIdValue },
    { key: "verified", value: verifiedValue },
    { key: "sort", value: sortValue },
    {
      key: "compare",
      value: compareIds.length > 0 ? compareIds.join(",") : undefined,
    },
  ].filter((entry) => entry.value);
  const preservedParamEntries = Object.entries(preservedParams)
    .filter(([, value]) => value)
    .map(([key, value]) => ({ key, value: String(value) }));
  const dealerLabel = dealerIdValue
    ? publicDealerLabel(dealers.find((dealer) => dealer.id === dealerIdValue)?.code)
    : null;
  type RawFilterChip = {
    key: string;
    label: string;
    overrides: Record<string, string | null | undefined>;
  };
  const rawFilterChips: (RawFilterChip | null)[] = [
    qValue
      ? {
          key: "q",
          label: formatFilterLabel("Search", qValue),
          overrides: { q: null },
        }
      : null,
    typeValue
      ? {
          key: "type",
          label: formatFilterLabel("Type", toTitle(typeValue) ?? typeValue),
          overrides: { type: null },
        }
      : null,
    fuelValue
      ? {
          key: "fuel",
          label: formatFilterLabel("Fuel", toTitle(fuelValue) ?? fuelValue),
          overrides: { fuel: null },
        }
      : null,
    transmissionValue
      ? {
          key: "transmission",
          label: formatFilterLabel(
            "Transmission",
            toTitle(transmissionValue) ?? transmissionValue
          ),
          overrides: { transmission: null },
        }
      : null,
    locationValue
      ? {
          key: "location",
          label: formatFilterLabel("Location", locationValue),
          overrides: { location: null },
        }
      : null,
    cityValue
      ? {
          key: "city",
          label: formatFilterLabel("City", cityValue),
          overrides: { city: null },
        }
      : null,
    priceModeValue === "custom" && (minPriceValue || maxPriceValue)
      ? {
          key: "price",
          label: `Price: ${formatPrice(parseNumber(minPriceValue ?? undefined))} - ${formatPrice(parseNumber(maxPriceValue ?? undefined))}`,
          overrides: { min_price: null, max_price: null, price_mode: null },
        }
      : null,
    yearMinValue || yearMaxValue
      ? {
          key: "year",
          label: `Year: ${yearMinValue ?? "Any"} - ${yearMaxValue ?? "Any"}`,
          overrides: { year_min: null, year_max: null },
        }
      : null,
    dealerIdValue
      ? {
          key: "dealer_id",
          label: dealerLabel ?? "Dealer",
          overrides: { dealer_id: null },
        }
      : null,
    verifiedValue === "1"
      ? {
          key: "verified",
          label: "Verified dealers only",
          overrides: { verified: null },
        }
      : null,
    budgetValue
      ? {
          key: "budget",
          label: `Budget: ${getBudgetLabel(budgetValue) ?? budgetValue}`,
          overrides: { budget: null },
        }
      : null,
    sortValue && sortValue !== "recent"
      ? {
          key: "sort",
          label: formatFilterLabel("Sort", getSortLabel(sortValue)),
          overrides: { sort: "recent" },
        }
      : null,
  ];
  const filterChips = rawFilterChips
    .filter((chip): chip is RawFilterChip => chip !== null)
    .map((chip) => ({
      ...chip,
      overrides: Object.fromEntries(
        Object.entries(chip.overrides).filter(([, value]) => value !== undefined)
      ) as Record<string, string | null>,
    }));
  return (
    <main className="simple-page carwale-listings-page">
      <section className="simple-shell">
        <input
          id="cw-filter-toggle"
          className="cw-filter-toggle"
          type="checkbox"
          aria-hidden="true"
        />
        <label className="cw-filter-backdrop" htmlFor="cw-filter-toggle" aria-hidden="true">
          <span className="cw-filter-backdrop__sr">Close filters</span>
        </label>
        <nav className="cw-nav">
          <div className="cw-nav__brand">SangroCars</div>
          <div className="cw-nav__links">
            <Link href="/sell">Sell Car</Link>
            <Link href="/dealer-admin/login">Dealer Login</Link>
            <Link href="/deals-of-the-week">
              Deals of Week
            </Link>
            <Link href="/#about">About</Link>
            <Link href="/#contact">Contact</Link>
          </div>
        </nav>
        <div className="simple-header cw-header">
          <div className="cw-header__row">
            <div className="cw-header__copy">
              <div className="cw-header__branding">
                <div className="cw-header__logo">
                  <img src="/images/sangrocars-logo.png" alt="SangroCars" />
                </div>
                <div className="cw-header__brand-text">
                  <span className="cw-header__brand-name">SangroCars</span>
                  <span className="cw-header__brand-tagline">
                    India's Trusted Used Car Marketplace
                  </span>
                </div>
              </div>
              <div className="cw-header__headline">
                <h1>Used cars in India</h1>
                <p>
                  Explore verified listings by budget, city, fuel, and transmission.
                </p>
                <div className="cw-header__trust">
                  <span>✓ 10,000+ cars listed</span>
                  <span>✓ Direct owner listings</span>
                  <span>✓ No dealer spam</span>
                </div>
              </div>
            </div>
            <div className="cw-header__actions">
              <Link
                className="cw-header__btn cw-header__btn--luxury"
                href="/deals-of-the-week"
              >
                Deals of week
              </Link>
              <Link className="cw-header__btn cw-header__btn--ghost" href="/sell">
                Post your car
              </Link>
              <Link className="cw-header__btn cw-header__btn--ghost" href="/dealer-admin/login">
                Dealer login
              </Link>
              {whatsappHref && (
                <a
                  className="cw-header__btn cw-header__btn--whatsapp"
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp SangroCars
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="cw-search">
          <div className="cw-search__row">
            <label className="cw-filter-btn" htmlFor="cw-filter-toggle">
              Filters
            </label>
            <form className="cw-search-bar" method="get">
              <div className="cw-search-bar__field">
                <input
                  className="cw-search-bar__input"
                  name="q"
                  type="search"
                  aria-label="Search cars"
                  placeholder="Search make or model"
                  defaultValue={qValue}
                />
              </div>
              <div className="cw-search-bar__select">
                <select name="city" defaultValue={cityValue ?? ""} aria-label="City">
                  <option value="">All cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="cw-search-bar__select">
                <select
                  name="budget"
                  defaultValue={budgetValue ?? ""}
                  aria-label="Budget"
                >
                  {BUDGET_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button className="cw-search-bar__submit" type="submit">
                Search
              </button>
              {topSearchHiddenEntries.map((entry) => (
                <input
                  key={entry.key}
                  type="hidden"
                  name={entry.key}
                  value={String(entry.value)}
                />
              ))}
              <input type="hidden" name="page" value="1" />
            </form>
          </div>
          <div className="cw-search-popular">
            <span>Popular:</span>
            {POPULAR_SEARCHES.map((term) => (
              <Link
                key={term}
                className="cw-pill"
                href={`/listings?${buildQuery(params, { q: term, page: "1" })}`}
              >
                {term}
              </Link>
            ))}
          </div>
        </div>

        <div className="cw-trust">
          {[
            {
              label: "100% Verified Listings",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M9.5 16.2L5.8 12.5l1.4-1.4 2.3 2.3 6.3-6.3 1.4 1.4z"
                  />
                </svg>
              ),
            },
            {
              label: "Direct Owner Cars",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5Z"
                  />
                </svg>
              ),
            },
            {
              label: "No Dealer Spam",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm6.5 10a6.4 6.4 0 0 1-1.3 3.9L8.1 6.8A8 8 0 0 1 18.5 12Zm-13 0a6.4 6.4 0 0 1 1.3-3.9l9.1 9.1A8 8 0 0 1 5.5 12Z"
                  />
                </svg>
              ),
            },
            {
              label: "Secure WhatsApp Contact",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M20 3H4a2 2 0 0 0-2 2v12l4-3h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-2.6 6.6-4.5 4.1a1 1 0 0 1-1.3 0L7 9.6l1.2-1.4 4.1 3.6 4.1-3.6Z"
                  />
                </svg>
              ),
            },
          ].map((item) => (
            <div key={item.label} className="cw-trust__item">
              <span className="cw-trust__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className="cw-stats-row">
          {[
            {
              label: "Local listings from verified sellers",
              value: "Jalandhar car marketplace",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11h1a1 1 0 0 1 1 1v4a2 2 0 0 1-2 2h-1a2 2 0 0 1-4 0H10a2 2 0 0 1-4 0H5a2 2 0 0 1-2-2v-4a1 1 0 0 1 1-1Zm2.3-4L6.3 10h11.4l-1-3a1 1 0 0 0-.95-.7H8.4a1 1 0 0 0-.95.7Z"
                  />
                </svg>
              ),
            },
            {
              label: "SangroCars helps buyers get the best price",
              value: "Direct negotiation",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5Z"
                  />
                </svg>
              ),
            },
            {
              label: "Get everything done in one place",
              value: "Finance & insurance support",
              icon: (
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM8 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 2c-3.3 0-6 1.4-6 3.2V20h12v-2.8c0-1.8-2.7-3.2-6-3.2Zm-8 1c-2.7 0-5 1.1-5 2.6V20h6v-2.4c0-1.1.4-2.1 1.1-2.9A8.3 8.3 0 0 0 8 15Z"
                  />
                </svg>
              ),
            },
          ].map((stat) => (
            <div key={stat.label} className="cw-stat">
              <span className="cw-stat__icon" aria-hidden="true">
                {stat.icon}
              </span>
              <div className="cw-stat__text">
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>

        <section className="cw-recent">
          <div className="cw-featured__header">
            <div>
              <h2>Recently added</h2>
              <p>Fresh arrivals uploaded by verified sellers.</p>
            </div>
          </div>
          <div className="cw-featured__grid">
            {recentListings.map((listing) => {
              const photo = getPrimaryPhoto(listing.photo_urls);
              const titleParts = [
                listing.year ?? undefined,
                toTitle(listing.make),
                toTitle(listing.model),
                toTitle(listing.variant),
              ].filter(Boolean);
              const kmText = listing.km
                ? `${listing.km.toLocaleString("en-IN")} km`
                : "Km on request";
              return (
                <Link
                  className="cw-featured__card"
                  href={`/listing/${listing.id}`}
                  key={`recent-${listing.id}`}
                >
                  <div className="cw-featured__media">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={String(listing.model ?? "Car")}
                        fill
                        sizes="(max-width: 980px) 100vw, 320px"
                        className="cw-featured__image"
                      />
                    ) : (
                      <div className="cw-featured__placeholder" />
                    )}
                  </div>
                  <div className="cw-featured__body">
                    <h3>{titleParts.join(" ")}</h3>
                    <strong>{formatPrice(listing.price)}</strong>
                    <p>
                      {listing.year ?? "Year"} • {kmText} •{" "}
                      {toTitle(listing.fuel) ?? "Fuel"}
                    </p>
                    <span className="cw-featured__city">
                      {getCityFromLocation(listing.location) ?? "City on request"}
                    </span>
                    <span className="cw-featured__link">
                      View details
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="cw-featured">
          <div className="cw-featured__header">
            <div>
              <h2>Featured cars</h2>
              <p>Handpicked listings with great value and verified sellers.</p>
            </div>
          </div>
          <div className="cw-featured__grid">
            {featuredListings.map((listing) => {
              const photo = getPrimaryPhoto(listing.photo_urls);
              const titleParts = [
                listing.year ?? undefined,
                toTitle(listing.make),
                toTitle(listing.model),
                toTitle(listing.variant),
              ].filter(Boolean);
              const kmText = listing.km
                ? `${listing.km.toLocaleString("en-IN")} km`
                : "Km on request";
              return (
                <Link
                  className="cw-featured__card"
                  href={`/listing/${listing.id}`}
                  key={`featured-${listing.id}`}
                >
                  <div className="cw-featured__media">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={String(listing.model ?? "Car")}
                        fill
                        sizes="(max-width: 980px) 100vw, 320px"
                        className="cw-featured__image"
                      />
                    ) : (
                      <div className="cw-featured__placeholder" />
                    )}
                  </div>
                  <div className="cw-featured__body">
                    <h3>{titleParts.join(" ")}</h3>
                    <strong>{formatPrice(listing.price)}</strong>
                    <p>
                      {listing.year ?? "Year"} • {kmText} •{" "}
                      {toTitle(listing.fuel) ?? "Fuel"}
                    </p>
                    <span className="cw-featured__city">
                      {getCityFromLocation(listing.location) ?? "City on request"}
                    </span>
                    <span className="cw-featured__link">
                      View details
                    </span>
                  </div>
                </Link>
              );
            })}
            {listings.length === 0 &&
              [
                {
                  id: "fallback-1",
                  title: "Hyundai Creta SX",
                  price: "₹11,20,000",
                  meta: "2019 • 45,000 km • Petrol",
                  city: "Jalandhar",
                },
                {
                  id: "fallback-2",
                  title: "Mahindra Thar LX",
                  price: "₹14,75,000",
                  meta: "2021 • 18,000 km • Diesel",
                  city: "Ludhiana",
                },
                {
                  id: "fallback-3",
                  title: "Toyota Fortuner",
                  price: "₹32,50,000",
                  meta: "2020 • 36,000 km • Diesel",
                  city: "Delhi",
                },
                {
                  id: "fallback-4",
                  title: "Maruti Swift VXI",
                  price: "₹6,20,000",
                  meta: "2018 • 52,000 km • Petrol",
                  city: "Jaipur",
                },
              ].map((item) => (
                <div className="cw-featured__card" key={item.id}>
                  <div className="cw-featured__media">
                    <div className="cw-featured__placeholder" />
                  </div>
                  <div className="cw-featured__body">
                    <h3>{item.title}</h3>
                    <strong>{item.price}</strong>
                    <p>{item.meta}</p>
                    <span className="cw-featured__city">{item.city}</span>
                    <span className="cw-featured__link cw-featured__link--muted">
                      View details
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </section>

        <div className="listings-layout listings-layout--carwale">
          <aside className="listings-layout__filters listings-layout__filters--left">
            <form
              className="simple-filters simple-filters--sidebar cw-filters"
              method="get"
            >
              <div className="cw-filters__head">
                <h2>Filters</h2>
                <div className="cw-filters__actions">
                  <Link className="simple-link" href="/listings">
                    Reset
                  </Link>
                  <label className="cw-filter-close" htmlFor="cw-filter-toggle">
                    Close
                  </label>
                </div>
              </div>
              <label className="simple-field">
                City
                <select name="city" defaultValue={cityValue ?? ""}>
                  <option value="">All cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
              <label className="simple-field">
                Dealer
                <select name="dealer_id" defaultValue={dealerIdValue ?? ""}>
                  <option value="">All dealers</option>
                  {dealers.map((dealer) => (
                    <option key={dealer.id} value={dealer.id}>
                      {publicDealerLabel(dealer.code)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="simple-checkbox">
                <input
                  type="checkbox"
                  name="verified"
                  value="1"
                  defaultChecked={verifiedValue === "1"}
                />
                Verified dealers only
              </label>
              <label className="simple-field">
                Location (optional)
                <input
                  name="location"
                  placeholder="Area / full location"
                  defaultValue={locationValue}
                />
              </label>
              <label className="simple-field">
                From year
                <input
                  name="year_min"
                  placeholder="e.g., 2018"
                  defaultValue={yearMinValue}
                />
              </label>
              <label className="simple-field">
                To year
                <input
                  name="year_max"
                  placeholder="e.g., 2025"
                  defaultValue={yearMaxValue}
                />
              </label>
              <label className="simple-field">
                Type
                <select name="type" defaultValue={typeValue ?? ""}>
                  <option value="">Any</option>
                  <option value="new">New</option>
                  <option value="used">Used</option>
                </select>
              </label>
              <label className="simple-field">
                Transmission
                <select name="transmission" defaultValue={transmissionValue ?? ""}>
                  <option value="">Any</option>
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                  <option value="cvt">CVT</option>
                  <option value="amt">AMT</option>
                </select>
              </label>
              <label className="simple-field">
                Fuel
                <select name="fuel" defaultValue={fuelValue ?? ""}>
                  <option value="">Any</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="cng">CNG</option>
                  <option value="electric">EV</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </label>
              <label className="simple-field simple-field--wide">
                Budget
                <PriceRangeSlider
                  minBound={priceBounds.min}
                  maxBound={priceBounds.max}
                  initialMin={parseNumber(minPriceValue ?? undefined)}
                  initialMax={parseNumber(maxPriceValue ?? undefined)}
                  initialMode={priceModeValue}
                />
              </label>
              <input type="hidden" name="page" value="1" />
              <input type="hidden" name="sort" value={sortValue} />
              <button className="simple-button simple-button--full" type="submit">
                Show cars
              </button>
            </form>
          </aside>

          <section className="listings-layout__results simple-results cw-results">
            {compareIds.length > 0 && (
              <div className="simple-compare-bar">
                <p>
                  {compareIds.length} car{compareIds.length > 1 ? "s" : ""} selected
                  for compare
                </p>
                <div className="simple-compare-bar__actions">
                  <Link
                    className="simple-link-btn"
                    href={`/listings?${buildQuery(params, { compare: null })}`}
                  >
                    Clear
                  </Link>
                  <Link
                    className="simple-button"
                    href={`/compare?ids=${compareIds.join(",")}`}
                  >
                    Compare now
                  </Link>
                </div>
              </div>
            )}

            <div className="simple-results__header">
              <div>
                <h2>Search results</h2>
                <p>
                  {error
                    ? "Listings are unavailable right now. Check your Supabase connection."
                    : `Showing ${listings.length} of ${count} listings (page ${page} of ${totalPages})`}
                </p>
              </div>
              <SortForm
                sortValue={sortValue}
                preservedParams={preservedParamEntries}
              />
            </div>

            {filterChips.length > 0 && (
              <div className="simple-chip-row">
                {filterChips.map((chip) => (
                  <Link
                    key={chip.key}
                    className="simple-chip"
                    href={`/listings?${buildQuery(params, {
                      ...chip.overrides,
                      page: "1",
                    })}`}
                  >
                    {chip.label} x
                  </Link>
                ))}
                <Link className="simple-chip simple-chip--clear" href="/listings">
                  Clear all
                </Link>
              </div>
            )}

            <div className="simple-listings cw-listings">
              {listings.length === 0 ? (
                <div className="simple-empty">
                  No listings match these filters yet. Try a wider search.
                </div>
              ) : (
                listings.map((listing) => {
                  const photo = getPrimaryPhoto(listing.photo_urls);
                  const titleParts = [
                    listing.year ?? undefined,
                    toTitle(listing.make),
                    toTitle(listing.model),
                    toTitle(listing.variant),
                  ].filter(Boolean);
                  const isLuxury = isLuxuryListing(listing.price);
                  const isCompared = compareIds.includes(listing.id);
                  const nextCompareIds = isCompared
                    ? compareIds.filter((id) => id !== listing.id)
                    : [...compareIds, listing.id].slice(0, 3);
                  const canAddToCompare = isCompared || compareIds.length < 3;
                  const emi = estimateEmi(listing.price);
                  const city = getCityFromLocation(listing.location);
                  const dealerInfo = listing.dealer_id
                    ? dealerMap.get(listing.dealer_id)
                    : null;
                  const dealerName = listing.dealer_id
                    ? publicDealerLabel(dealerInfo?.code)
                    : "Private seller";
                  const dealerCount = listing.dealer_id
                    ? dealerCounts.get(listing.dealer_id) ?? 0
                    : null;
                  const kmText = listing.km
                    ? `${listing.km.toLocaleString("en-IN")} km`
                    : "Km on request";
                  const isCertified = Boolean(listing.stock_id);
                  const listingCode = listing.id.slice(0, 6).toUpperCase();
                  const compareHref = isCompared
                    ? `/listings?${buildQuery(params, {
                        compare: nextCompareIds.length ? nextCompareIds.join(",") : null,
                      })}`
                    : nextCompareIds.length >= 2
                      ? `/compare?ids=${nextCompareIds.join(",")}`
                      : `/listings?${buildQuery(params, {
                          compare: nextCompareIds.length ? nextCompareIds.join(",") : null,
                        })}`;
                  const listingHref =
                    compareIds.length > 0 && !isCompared
                      ? compareHref
                      : compareIds.length
                        ? `/listing/${listing.id}?compare=${compareIds.join(",")}`
                        : `/listing/${listing.id}`;
                  const primaryActionLabel =
                    compareIds.length > 0 && !isCompared
                      ? "Compare with selected car"
                      : "View details";
                  return (
                    <article className="simple-listing cw-listing" key={listing.id}>
                      <div className="simple-listing__media cw-listing__media">
                        {photo ? (
                          <Image
                            src={photo}
                            alt={String(listing.model ?? "Car")}
                            fill
                            sizes="(max-width: 980px) 100vw, 320px"
                            className="simple-listing__image"
                          />
                        ) : (
                          <div className="simple-listing__placeholder" />
                        )}
                        <div className="simple-listing__tag-stack">
                          <span className="simple-listing__tag">Available</span>
                          <span
                            className="simple-listing__tag simple-listing__tag--id"
                            title={`Listing ID: ${listing.id}`}
                          >
                            ID {listingCode}
                          </span>
                          {isLuxury && (
                            <span className="simple-listing__tag simple-listing__tag--luxury">
                              Luxury
                            </span>
                          )}
                        </div>
                        <Link
                          href={listingHref}
                          className="cw-listing__image-link"
                          aria-label={`View ${titleParts.join(" ") || "car listing"}`}
                        />
                        {canAddToCompare ? (
                          <Link
                            className={`cw-save-btn${isCompared ? " cw-save-btn--active" : ""}`}
                            href={compareHref}
                            aria-label={isCompared ? "Remove saved car" : "Save this car"}
                            title={isCompared ? "Remove from saved" : "Save this car"}
                          >
                            ❤
                          </Link>
                        ) : (
                          <span
                            className="cw-save-btn cw-save-btn--disabled"
                            aria-label="Maximum 3 saved cars"
                            title="Maximum 3 saved cars"
                          >
                            ❤
                          </span>
                        )}
                      </div>
                      <div className="simple-listing__body cw-listing__body">
                        <h3>{titleParts.join(" ")}</h3>
                        <div className="cw-listing__price-row">
                          <strong className="cw-listing__price-line">
                            {formatPrice(listing.price)}
                          </strong>
                          {isCertified && (
                            <span className="cw-certified-badge">Certified</span>
                          )}
                        </div>
                        <div className="cw-listing__facts">
                          <span>{kmText}</span>
                          <span>{city || "City on request"}</span>
                        </div>
                        {(listing.fuel || listing.transmission) && (
                          <p className="cw-listing__location">
                            {[toTitle(listing.fuel), toTitle(listing.transmission)]
                              .filter(Boolean)
                              .join(" • ")}
                          </p>
                        )}
                        <div className="cw-listing__dealer">
                          <div className="cw-listing__dealer-head">
                            <span className="cw-dealer-logo cw-dealer-logo--fallback">
                              {listing.dealer_id ? "#" : "P"}
                            </span>
                            <div>
                              <span className="cw-dealer-name">{dealerName}</span>
                              <div className="cw-dealer-meta">
                                {listing.dealer_id
                                  ? `Verified dealer · ${dealerCount} active cars`
                                  : "Private seller"}
                              </div>
                            </div>
                          </div>
                          {listing.dealer_id && (
                            <div className="cw-dealer-row">
                              <span className="cw-dealer-response">
                                Usually responds in 10 mins
                              </span>
                            </div>
                          )}
                        </div>
                        {emi && <span className="cw-listing__emi">{emi}</span>}
                        <div className="cw-listing__finance">
                          <span>Finance available</span>
                          <span>Insurance assistance</span>
                        </div>
                        <div className="simple-listing__actions cw-listing__actions">
                          <Link
                            className="simple-button simple-button--full"
                            href={listingHref}
                          >
                            {primaryActionLabel}
                          </Link>
                          {canAddToCompare ? (
                            <Link className="simple-link-btn" href={compareHref}>
                              {isCompared ? "Remove compare" : "Add compare"}
                            </Link>
                          ) : (
                            <span className="simple-link-btn simple-link-btn--muted">
                              Max 3 cars
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            {!error && count > PAGE_SIZE && (
              <div className="simple-pagination">
                {page > 1 && (
                  <Link
                    className="simple-button simple-button--secondary"
                    href={`/listings?${buildQuery(params, {
                      page: String(page - 1),
                    })}`}
                  >
                    Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    className="simple-button"
                    href={`/listings?${buildQuery(params, {
                      page: String(page + 1),
                    })}`}
                  >
                    Load more
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>

        <footer className="cw-footer">
          <div className="cw-footer__grid">
            <div className="cw-footer__col">
              <h3 className="cw-footer__title">SangroCars</h3>
              <p>
                India&apos;s trusted used car marketplace. Discover verified cars,
                compare prices, and connect directly with sellers.
              </p>
              <a className="cw-footer__link" href="/listings">
                Buy cars
              </a>
              <a className="cw-footer__link" href="/sell">
                Sell your car
              </a>
              <a
                className="cw-footer__link"
                href="/deals-of-the-week"
              >
                Deals of week
              </a>
              <a className="cw-footer__link" href="/#contact">
                Contact
              </a>
            </div>
            <div className="cw-footer__col">
              <h3 className="cw-footer__title">Connect With Us</h3>
              <a className="cw-footer__link" href="/listings">
                Buy cars
              </a>
              <a className="cw-footer__link" href="/sell">
                Post your car
              </a>
              <a className="cw-footer__link" href="/dealer-admin">
                Dealer login
              </a>
              <a className="cw-footer__link" href="/#contact">
                Support
              </a>
            </div>
            <div className="cw-footer__col">
              <h3 className="cw-footer__title">Experience SangroCars App</h3>
              <p>Search, compare, and save cars from your phone.</p>
              <div className="cw-footer__apps">
                <a
                  className="store-badge store-badge--play"
                  href="#"
                  aria-label="Get it on Google Play"
                >
                  <span className="store-badge__icon" aria-hidden="true">
                    <svg viewBox="0 0 512 512" role="img" aria-hidden="true">
                      <path
                        fill="#34A853"
                        d="M70 58c-6 6-10 16-10 30v336c0 14 4 24 10 30l194-194L70 58z"
                      />
                      <path
                        fill="#FBBC04"
                        d="M264 256l66-66 78 45c22 13 22 35 0 48l-78 45-66-66z"
                      />
                      <path
                        fill="#4285F4"
                        d="M264 256L70 454c9 9 24 10 40 1l220-126-66-73z"
                      />
                      <path
                        fill="#EA4335"
                        d="M264 256l66-66-220-126c-16-9-31-8-40 1l194 191z"
                      />
                    </svg>
                  </span>
                  <span className="store-badge__text">
                    <span className="store-badge__kicker">GET IT ON</span>
                    <span className="store-badge__label">Google Play</span>
                  </span>
                </a>
                <a
                  className="store-badge store-badge--apple"
                  href="#"
                  aria-label="Download on the App Store"
                >
                  <span className="store-badge__icon" aria-hidden="true">
                    <svg viewBox="0 0 384 512" role="img" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M318 268c-1-44 36-65 38-66-21-30-54-34-66-35-28-3-54 17-69 17-14 0-36-17-59-16-30 1-58 17-74 43-32 55-8 136 23 180 15 22 33 47 57 46 23-1 31-15 59-15s35 15 59 14c24-1 40-23 55-45 17-25 24-50 24-52-1 0-46-18-47-71z"
                      />
                      <path
                        fill="currentColor"
                        d="M260 77c13-16 22-38 19-60-19 1-41 12-54 28-12 14-23 36-20 57 21 2 42-10 55-25z"
                      />
                    </svg>
                  </span>
                  <span className="store-badge__text">
                    <span className="store-badge__kicker">DOWNLOAD ON THE</span>
                    <span className="store-badge__label">App Store</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
          <div className="cw-footer__bottom">
            <span>SangroCars</span>
            <span>© 2026 SangroCars</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
