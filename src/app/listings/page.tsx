import Image from "next/image";
import Link from "next/link";
import InfiniteListings from "@/app/listings/InfiniteListings";
import ContactSection from "@/app/components/ContactSection";
import PriceRangeSlider from "@/app/components/PriceRangeSlider";
import { hasSupabaseConfig, supabaseServerOptional } from "@/lib/supabase";
import { getPrimaryPhoto } from "@/lib/photoUrls";
import { extractDealerCode } from "@/lib/dealerCode";
import {
  formatCityTitle,
  formatKm,
  formatLocationTitle,
  formatPriceCompact,
  titleCase,
} from "@/lib/listingDisplay";
import {
  attachDealerMeta,
  fetchPublicListingsPage,
  getParam,
  ListingsSearchParams as SearchParams,
  PAGE_SIZE,
  parseNumber,
} from "@/lib/publicListings";

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

type DealerOption = {
  id: string;
  code: string | null;
};

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

const getBudgetLabel = (value?: string | null) => {
  if (!value) return null;
  return BUDGET_OPTIONS.find((option) => option.value === value)?.label ?? null;
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
  };

  for (const [key, value] of Object.entries(entries)) {
    const override = overrides[key];
    const finalValue =
      override === undefined ? value : override === null ? "" : override;
    if (finalValue) params.set(key, finalValue);
  }

  return params.toString();
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

const formatPrice = formatPriceCompact;
const toTitle = titleCase;
const getCityFromLocation = formatCityTitle;

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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const whatsappHref = buildSupportWhatsApp();
  const params = await searchParams;
  const [{ listings: rawListings, count, error }, cities, priceBounds, dealers] =
    await Promise.all([
      fetchPublicListingsPage(params, { offset: 0, limit: PAGE_SIZE, includeCount: true }),
      getCityOptions(),
      getPriceBounds(),
      getDealerOptions(),
    ]);
  const listings = await attachDealerMeta(rawListings);
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
  const recentListings = listings.slice(0, 4);
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
          <div className="cw-nav__brand">
            <img src="/images/sangrocars-logo.png" alt="SangroCars" />
            <span>SangroCars</span>
          </div>
          <div className="cw-nav__links">
            <Link href="/sell">Sell Car</Link>
            <Link href="/dealer-admin/login">Dealer Login</Link>
            <Link href="/deals-of-the-week">
              Deals of Week
            </Link>
            <Link href="/about">About</Link>
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
                  <span>✓ All kinds of cars available</span>
                  <span>✓ Direct owner listings</span>
                  <span>🛡 Verified dealer listings</span>
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
            </form>
          </div>
          <div className="cw-search-popular">
            <span>Popular:</span>
            {POPULAR_SEARCHES.map((term) => (
              <Link
                key={term}
                className="cw-pill"
                href={`/listings?${buildQuery(params, { q: term })}`}
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
              label: "Dealer Listings",
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
              const kmText = formatKm(listing.km);
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
                      {[kmText, toTitle(listing.fuel), toTitle(listing.transmission)]
                        .filter(Boolean)
                        .join(" • ")}
                    </p>
                    <span className="cw-featured__city">
                      {formatLocationTitle(listing.location) ?? "City on request"}
                    </span>
                    <span className="cw-featured__link cw-featured__button">
                      View Details →
                    </span>
                  </div>
                </Link>
              );
            })}
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
              <input type="hidden" name="sort" value={sortValue} />
              <button className="simple-button simple-button--full" type="submit">
                Show cars
              </button>
            </form>
          </aside>

          <section className="listings-layout__results simple-results cw-results">
            {filterChips.length > 0 && (
              <div className="simple-chip-row">
                {filterChips.map((chip) => (
                  <Link
                    key={chip.key}
                    className="simple-chip"
                    href={`/listings?${buildQuery(params, chip.overrides)}`}
                  >
                    {chip.label} x
                  </Link>
                ))}
                <Link className="simple-chip simple-chip--clear" href="/listings">
                  Clear all
                </Link>
              </div>
            )}
            <InfiniteListings
              initialListings={listings}
              totalCount={count}
              error={error}
              sortValue={sortValue}
              preservedParamEntries={preservedParamEntries}
              currentQueryParams={{
                q: qValue ?? undefined,
                min_price: minPriceValue ?? undefined,
                max_price: maxPriceValue ?? undefined,
                price_mode:
                  priceModeValue === "custom" ? priceModeValue : undefined,
                fuel: fuelValue ?? undefined,
                transmission: transmissionValue ?? undefined,
                type: typeValue ?? undefined,
                year_min: yearMinValue ?? undefined,
                year_max: yearMaxValue ?? undefined,
                city: cityValue ?? undefined,
                location: locationValue ?? undefined,
                budget: budgetValue ?? undefined,
                dealer_id: dealerIdValue ?? undefined,
                verified: verifiedValue ?? undefined,
                sort: sortValue,
              }}
            />
          </section>
        </div>

          <ContactSection id="contact" compact source="homepage_contact" />

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
              <a className="cw-footer__link" href="/contact">
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
              <a className="cw-footer__link" href="/about">
                About
              </a>
              <a className="cw-footer__link" href="/dealer-admin">
                Dealer login
              </a>
              <a className="cw-footer__link" href="/contact">
                Contact
              </a>
            </div>
            <div className="cw-footer__col">
              <h3 className="cw-footer__title">Why SangroCars</h3>
              <p>We keep the buying journey simple, trusted, and supported from first click to delivery.</p>
              <span className="cw-footer__link">✓ Verified dealers</span>
              <span className="cw-footer__link">✓ Secure paperwork support</span>
              <span className="cw-footer__link">✓ Finance & insurance assistance</span>
              <span className="cw-footer__link">✓ Direct contact with sellers</span>
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
