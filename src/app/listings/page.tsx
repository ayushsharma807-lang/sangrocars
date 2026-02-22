import Image from "next/image";
import Link from "next/link";
import SortForm from "@/app/components/SortForm";
import PriceRangeSlider from "@/app/components/PriceRangeSlider";
import { hasSupabaseConfig, supabaseServerOptional } from "@/lib/supabase";
import { getBrandArModel } from "@/lib/arModels";

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
  sort?: string | string[];
  page?: string | string[];
  compare?: string | string[];
};

type Listing = {
  id: string;
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

const PAGE_SIZE = 9;
const DEFAULT_PRICE_MIN = 100_000;
const DEFAULT_PRICE_MAX = 5_000_000;

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

const hasArModel = (make?: string | null, description?: string | null) =>
  Boolean(
    (description && description.includes("[AR_MODEL_URL]:")) ||
      getBrandArModel(make)
  );

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
      "id, make, model, variant, year, price, km, fuel, transmission, location, description, photo_urls, stock_id",
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
  const params = await searchParams;
  const [{ listings, count, error, page }, cities, priceBounds] =
    await Promise.all([
      getListings(params),
      getCityOptions(),
      getPriceBounds(),
    ]);
  const qValue = getParam(params.q);
  const minPriceValue = getParam(params.min_price);
  const maxPriceValue = getParam(params.max_price);
  const priceModeValue = getParam(params.price_mode) ?? "any";
  const yearMinValue = getParam(params.year_min);
  const yearMaxValue = getParam(params.year_max);
  const fuelValue = getParam(params.fuel);
  const cityValue = getParam(params.city);
  const locationValue = getParam(params.location);
  const transmissionValue = getParam(params.transmission);
  const typeValue = getParam(params.type);
  const sortValue = getParam(params.sort) ?? "recent";
  const compareIds = parseCompareIds(params.compare);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
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
    { key: "city", value: cityValue },
    { key: "location", value: locationValue },
    { key: "sort", value: sortValue },
    {
      key: "compare",
      value: compareIds.length > 0 ? compareIds.join(",") : undefined,
    },
  ].filter((entry) => entry.value);
  const preservedParamEntries = Object.entries(preservedParams)
    .filter(([, value]) => value)
    .map(([key, value]) => ({ key, value: String(value) }));
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
        <div className="simple-header cw-header">
          <div>
            <h1>Used cars in India</h1>
            <p>
              Explore verified listings by budget, city, fuel, and transmission.
            </p>
          </div>
          <div className="simple-detail__top-actions cw-header__actions">
            <Link
              className="cw-header__btn cw-header__btn--luxury"
              href="/listings?price_mode=custom&min_price=4500000&sort=price_desc&page=1"
            >
              Luxury collection
            </Link>
            <Link className="cw-header__btn cw-header__btn--ghost" href="/">
              Back to home
            </Link>
            <Link className="cw-header__btn cw-header__btn--primary" href="/sell">
              Post your car
            </Link>
          </div>
        </div>
        <div className="cw-top-bar">
          <label className="cw-filter-btn" htmlFor="cw-filter-toggle">
            Filters
          </label>
          <form className="cw-top-search" method="get">
            <div className="cw-top-search__field">
              <span className="cw-top-search__scope" aria-hidden="true">
                All
              </span>
              <input
                className="cw-top-search__input"
                name="q"
                type="search"
                aria-label="Search cars"
                placeholder="Search make, model, variant"
                defaultValue={qValue}
              />
              <button
                className="cw-top-search__icon"
                type="submit"
                aria-label="Search cars"
              >
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle
                    cx="11"
                    cy="11"
                    r="6.5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 16L21 21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
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
                  const photo = listing.photo_urls?.[0];
                  const titleParts = [
                    listing.year ?? undefined,
                    toTitle(listing.make),
                    toTitle(listing.model),
                    toTitle(listing.variant),
                  ].filter(Boolean);
                  const isLuxury = isLuxuryListing(listing.price);
                  const hasArPreview = hasArModel(
                    listing.make,
                    listing.description
                  );
                  const isCompared = compareIds.includes(listing.id);
                  const nextCompareIds = isCompared
                    ? compareIds.filter((id) => id !== listing.id)
                    : [...compareIds, listing.id].slice(0, 3);
                  const canAddToCompare = isCompared || compareIds.length < 3;
                  const emi = estimateEmi(listing.price);
                  const city = getCityFromLocation(listing.location);
                  const kmText = listing.km
                    ? `${listing.km.toLocaleString("en-IN")} km`
                    : "Km on request";
                  const isCertified = Boolean(listing.stock_id);
                  const compareHref = `/listings?${buildQuery(params, {
                    compare: nextCompareIds.length ? nextCompareIds.join(",") : null,
                  })}`;
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
                          {isLuxury && (
                            <span className="simple-listing__tag simple-listing__tag--luxury">
                              Luxury
                            </span>
                          )}
                          {hasArPreview && (
                            <span className="simple-listing__tag simple-listing__tag--ar">
                              3D + AR
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/listing/${listing.id}`}
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
                        {emi && <span className="cw-listing__emi">{emi}</span>}
                        <div className="simple-listing__actions cw-listing__actions">
                          <Link
                            className="simple-button simple-button--full"
                            href={`/listing/${listing.id}`}
                          >
                            View details
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
              <h3 className="cw-footer__title">About Us</h3>
              <p>
                CarHub helps buyers discover verified cars faster. Compare prices,
                explore dealer inventory, and sell your car with confidence.
              </p>
              <a className="cw-footer__link" href="/learn">
                Learn more
              </a>
              <a className="cw-footer__link" href="/stories">
                Success stories
              </a>
              <a className="cw-footer__link" href="/experience">
                Our experience stack
              </a>
            </div>
            <div className="cw-footer__col">
              <h3 className="cw-footer__title">Connect With Us</h3>
              <a className="cw-footer__link" href="/live">
                Live events
              </a>
              <a className="cw-footer__link" href="/remote-docs">
                Remote docs
              </a>
              <a className="cw-footer__link" href="/sell">
                Post your car
              </a>
              <a className="cw-footer__link" href="/dealer-admin">
                Dealer login
              </a>
            </div>
            <div className="cw-footer__col">
              <h3 className="cw-footer__title">Experience CarHub App</h3>
              <p>Search, compare, and save cars from your phone.</p>
              <div className="cw-footer__apps">
                <a className="cw-footer__app" href="#">
                  Get it on Play Store
                </a>
                <a className="cw-footer__app" href="#">
                  Download on App Store
                </a>
              </div>
            </div>
          </div>
          <div className="cw-footer__bottom">
            <span>CarHub</span>
            <span>Trusted used car marketplace for India.</span>
          </div>
        </footer>
      </section>
    </main>
  );
}
