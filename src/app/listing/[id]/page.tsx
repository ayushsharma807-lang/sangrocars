import Link from "next/link";
import type { Metadata } from "next";
import { hasSupabaseConfig, supabaseServerOptional } from "@/lib/supabase";
import { parsePrivateSellerDescription } from "@/lib/privateSeller";
import { parseListingExperienceDescription } from "@/lib/listingExperience";
import ListingGallery from "./ListingGallery";
import LeadForm from "./LeadForm";
import EmiCalculator from "./EmiCalculator";
import NearbyDealersMap from "./NearbyDealersMap";
import SaveToGarageButton from "@/app/components/SaveToGarageButton";
import RecentViewTracker from "@/app/components/RecentViewTracker";
import PersonalizedPriceSignal from "@/app/components/PersonalizedPriceSignal";
import { getPrimaryPhoto, normalizePhotoUrls } from "@/lib/photoUrls";
import { dealerSlug } from "@/lib/dealerSlug";

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
  type: string | null;
  status: string | null;
};

type Dealer = {
  id: string;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
};

type PredictivePricing = {
  median: number;
  total: number;
  recommendation: string;
};

type SupabaseClient = NonNullable<ReturnType<typeof supabaseServerOptional>>;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sangrocars.in";
  if (!hasSupabaseConfig()) {
    return {
      title: "Used car listing",
      description: "Browse this used car on SangroCars.",
      alternates: { canonical: `/listing/${params.id}` },
    };
  }

  const sb = supabaseServerOptional();
  if (!sb) {
    return {
      title: "Used car listing",
      description: "Browse this used car on SangroCars.",
      alternates: { canonical: `/listing/${params.id}` },
    };
  }

  const { data } = await sb
    .from("listings")
    .select("make, model, variant, year, location, photo_urls")
    .eq("id", params.id)
    .maybeSingle();

  if (!data) {
    return {
      title: "Used car listing",
      description: "Browse this used car on SangroCars.",
      alternates: { canonical: `/listing/${params.id}` },
    };
  }

  const title = [
    data.year,
    data.make,
    data.model,
    data.variant,
    data.location ? `in ${data.location}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  const image = Array.isArray(data.photo_urls) ? data.photo_urls[0] : undefined;

  return {
    title: `${title} | SangroCars`,
    description: `View ${data.make ?? "used"} ${data.model ?? "car"} on SangroCars.`,
    alternates: { canonical: `/listing/${params.id}` },
    openGraph: {
      title,
      description: `View ${data.make ?? "used"} ${data.model ?? "car"} on SangroCars.`,
      url: `${siteUrl}/listing/${params.id}`,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

const formatPrice = (value: number | null) => {
  if (!value) return "Price on request";
  return `₹${value.toLocaleString("en-IN")}`;
};

const toTitle = (value: string | null) => {
  if (!value) return null;
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const normalizePhone = (value?: string | null) => {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const buildSupportLinks = (listingTitle: string, listingUrl: string) => {
  const raw =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ??
    process.env.NEXT_PUBLIC_SANGRO_PHONE ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    "";
  const digits = normalizePhone(raw);
  const message = encodeURIComponent(
    `Hi, I'm interested in the ${listingTitle} listed on SangroCars. ${listingUrl}`
  );
  return {
    tel: digits ? `tel:+${digits}` : null,
    whatsapp: digits ? `https://wa.me/${digits}?text=${message}` : null,
  };
};

const estimateEmi = (price?: number | null) => {
  if (!price) return null;
  const principal = price * 0.8;
  const monthlyRate = 0.009;
  const months = 60;
  const factor = Math.pow(1 + monthlyRate, months);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  if (!Number.isFinite(emi)) return null;
  return Math.round(emi);
};

const formatListingMeta = (listing: Listing) => {
  const parts = [
    listing.fuel ? toTitle(listing.fuel) : null,
    listing.transmission ? toTitle(listing.transmission) : null,
    listing.km ? `${listing.km.toLocaleString("en-IN")} km` : null,
  ].filter(Boolean) as string[];

  return parts.join(", ");
};

const sanitizeSellerName = (value: string | null) => {
  if (!value) return null;
  const lowered = value.toLowerCase();
  if (lowered.includes("telegram")) return null;
  if (lowered.includes("whatsapp")) return null;
  return value;
};

const median = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[middle - 1] + sorted[middle]) / 2;
  return sorted[middle];
};

const getPredictivePricing = async (
  sb: SupabaseClient,
  listing: Listing
): Promise<PredictivePricing | null> => {
  if (!listing.make || !listing.model) return null;

  let query = sb
    .from("listings")
    .select("id, price")
    .eq("status", "available")
    .not("price", "is", null)
    .limit(220);

  query = query.ilike("make", `%${listing.make}%`).ilike("model", `%${listing.model}%`);

  const { data, error } = await query;
  if (error || !data) return null;

  const prices = data
    .filter((row) => row.id !== listing.id)
    .map((row) => Number(row.price ?? 0))
    .filter((value) => Number.isFinite(value) && value > 0);

  const med = median(prices);
  if (!med) return null;

  let recommendation = "Pricing is aligned with current market demand.";
  if (listing.price && listing.price <= med * 0.95) {
    recommendation = "Good buy signal: this car is priced below the model median.";
  } else if (listing.price && listing.price >= med * 1.08) {
    recommendation = "Premium ask: negotiate or compare with similar listings.";
  }

  return {
    median: Math.round(med),
    total: prices.length,
    recommendation,
  };
};

export default async function ListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const { id } = await params;
  const debug =
    typeof searchParams?.debug === "string"
      ? searchParams.debug === "1"
      : Array.isArray(searchParams?.debug)
        ? searchParams?.debug[0] === "1"
        : false;
  if (!hasSupabaseConfig()) {
    return (
      <main className="simple-page simple-detail-page">
        <section className="simple-shell">
          <div className="simple-header">
            <h2>Listings unavailable</h2>
            <p>Supabase is not configured for this deployment.</p>
          </div>
          <Link className="simple-button" href="/listings">
            Back to listings
          </Link>
        </section>
      </main>
    );
  }
  const sb = supabaseServerOptional();
  if (!sb) {
    return (
      <main className="simple-page simple-detail-page">
        <section className="simple-shell">
          <div className="simple-header">
            <h2>Listings unavailable</h2>
            <p>Supabase is not configured for this deployment.</p>
          </div>
          <Link className="simple-button" href="/listings">
            Back to listings
          </Link>
        </section>
      </main>
    );
  }
  const { data, error } = await sb
    .from("listings")
    .select(
      "id, dealer_id, make, model, variant, year, price, km, fuel, transmission, location, description, photo_urls, type, status"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <main className="simple-page simple-detail-page">
        <section className="simple-shell">
          <div className="simple-header">
            <h2>Listing not found</h2>
            <p>We could not find that listing. Try searching again.</p>
          </div>
          <Link className="simple-button" href="/listings">
            Back to search
          </Link>
        </section>
      </main>
    );
  }

  const listing = data as Listing;
  if (listing.status && listing.status !== "available") {
    return (
      <main className="simple-page simple-detail-page">
        <section className="simple-shell">
          <div className="simple-header">
            <h2>
              {listing.status === "pending"
                ? "Listing awaiting approval"
                : "Listing not available"}
            </h2>
            <p>
              {listing.status === "pending"
                ? "Your car is submitted and will go live after admin approval."
                : "This listing is not available right now."}
            </p>
          </div>
          <Link className="simple-button" href="/listings">
            Back to listings
          </Link>
        </section>
      </main>
    );
  }
  const experienceInfo = parseListingExperienceDescription(listing.description);
  const privateSeller = parsePrivateSellerDescription(experienceInfo.cleanDescription);
  const overviewDescription =
    privateSeller.cleanDescription ||
    "Dealer-synced listing. Contact the dealer for inspection and availability.";
  const titleParts = [
    listing.year ?? undefined,
    toTitle(listing.make),
    toTitle(listing.model),
    toTitle(listing.variant),
  ].filter(Boolean);
  const photos = normalizePhotoUrls(listing.photo_urls);
  const listingTitle = titleParts.join(" ") || "Car listing";
  const listingUrlBase =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.sangrocars.in";
  const listingUrl = `${listingUrlBase}/listing/${listing.id}`;
  const primaryPhoto = getPrimaryPhoto(photos) ?? photos[0] ?? null;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: listingTitle,
    brand: listing.make ? { "@type": "Brand", name: listing.make } : undefined,
    model: listing.model ?? undefined,
    vehicleModelDate: listing.year ?? undefined,
    fuelType: listing.fuel ?? undefined,
    vehicleTransmission: listing.transmission ?? undefined,
    mileageFromOdometer: listing.km
      ? {
          "@type": "QuantitativeValue",
          value: listing.km,
          unitCode: "KMT",
        }
      : undefined,
    image: primaryPhoto ? [primaryPhoto] : undefined,
    offers: listing.price
      ? {
          "@type": "Offer",
          price: listing.price,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: listingUrl,
        }
      : undefined,
  };
  const predictivePricing = await getPredictivePricing(sb, listing);

  let dealer: Dealer | null = null;
  if (listing.dealer_id) {
    const { data: dealerData, error: dealerError } = await sb
      .from("dealers")
      .select("id, name, phone, whatsapp, email, address")
      .eq("id", listing.dealer_id)
      .single();
    if (!dealerError && dealerData) {
      dealer = dealerData as Dealer;
    }
  }
  let moreFromDealer: Listing[] = [];
  if (listing.dealer_id) {
    const { data: moreRows } = await sb
      .from("listings")
      .select(
        "id, make, model, variant, year, price, km, fuel, transmission, location, photo_urls"
      )
      .eq("dealer_id", listing.dealer_id)
      .eq("status", "available")
      .neq("id", listing.id)
      .order("last_seen_at", { ascending: false })
      .limit(4);
    moreFromDealer = (moreRows ?? []) as Listing[];
  }

  let similarListings: Listing[] = [];
  if (listing.make || listing.model) {
    const city = listing.location?.split(",")[0]?.trim();
    let query = sb
      .from("listings")
      .select(
        "id, make, model, variant, year, price, km, fuel, transmission, location, photo_urls"
      )
      .eq("status", "available")
      .neq("id", listing.id);
    if (listing.make) query = query.ilike("make", `%${listing.make}%`);
    if (listing.model) query = query.ilike("model", `%${listing.model}%`);
    if (city) query = query.ilike("location", `%${city}%`);
    const { data: similarRows } = await query.limit(4);
    similarListings = (similarRows ?? []) as Listing[];
  }

  const privateSellerName = sanitizeSellerName(privateSeller.seller.name);
  const dealerName =
    dealer?.name ?? privateSellerName ?? "Private seller";
  const dealerAddress = dealer?.address ?? listing.location ?? "Address on request";
  const supportLinks = buildSupportLinks(listingTitle, listingUrl);
  const estimatedEmi = estimateEmi(listing.price);
  const quickMeta = [
    listing.km ? `${listing.km.toLocaleString("en-IN")} km` : null,
    listing.fuel ? toTitle(listing.fuel) : null,
    listing.transmission ? toTitle(listing.transmission) : null,
  ].filter(Boolean);
  const highlights = [
    listing.km && listing.km < 40000 ? "Low mileage" : null,
    listing.year && listing.year >= 2022 ? "Recent model year" : null,
    listing.fuel ? `${toTitle(listing.fuel)} powertrain` : null,
    "Verified documents",
  ].filter(Boolean) as string[];
  const priceRange = predictivePricing
    ? {
        min: Math.round(predictivePricing.median * 0.9),
        max: Math.round(predictivePricing.median * 1.1),
      }
    : null;
  const priceLabel = predictivePricing?.median
    ? listing.price && listing.price <= predictivePricing.median
      ? "Good price"
      : "Premium price"
    : null;

  return (
    <main className="simple-page simple-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <a className="floating-cta" href={`?intent=best_price#lead-form`}>
        Request best price
      </a>
      <section className="simple-shell">
        <div
          className="whatsapp-context"
          data-whatsapp-context="listing"
          data-title={listingTitle}
          data-price={formatPrice(listing.price)}
          data-location={listing.location ?? ""}
          data-url={listingUrl}
        />
        <div className="listing-hero">
          <div className="listing-hero__brand">
            <div className="listing-hero__logo">
              <img src="/images/sangrocars-logo.png" alt="SangroCars" />
            </div>
            <div>
              <h1>{titleParts.join(" ")}</h1>
              <p>{listing.location || "Location on request"}</p>
              {quickMeta.length > 0 && (
                <p className="listing-hero__meta">{quickMeta.join(" · ")}</p>
              )}
            </div>
          </div>
          <div className="simple-detail__top-actions listing-hero__actions">
            <Link className="simple-button simple-button--secondary" href="/listings">
              ← Back to listings
            </Link>
            <Link className="simple-button simple-button--secondary" href={`/compare?ids=${listing.id}`}>
              🆚 Compare this car
            </Link>
            <SaveToGarageButton
              listingId={listing.id}
              title={listingTitle}
              price={listing.price}
              location={listing.location}
              photo={getPrimaryPhoto(photos)}
            />
          </div>
        </div>
        <RecentViewTracker
          listingId={listing.id}
          price={listing.price}
          make={listing.make}
          model={listing.model}
        />
        <div className="simple-detail__chips">
          {listing.type && (
            <span className="simple-pill">{toTitle(listing.type)}</span>
          )}
          {listing.fuel && (
            <span className="simple-pill">{toTitle(listing.fuel)}</span>
          )}
          {listing.transmission && (
            <span className="simple-pill">{toTitle(listing.transmission)}</span>
          )}
          {listing.km && (
            <span className="simple-pill">
              {listing.km.toLocaleString("en-IN")} km
            </span>
          )}
        </div>
        <div className="simple-detail__layout">
          <div className="simple-detail__panel">
            <ListingGallery photos={photos} alt={listingTitle} />
          </div>
          <div className="simple-detail__panel simple-detail__panel--stack">
            {debug && (
              <div className="simple-debug">
                <h3>Debug: Photo URLs</h3>
                <pre className="simple-debug__code">
                  Raw photo_urls: {JSON.stringify(listing.photo_urls, null, 2)}
                </pre>
                <pre className="simple-debug__code">
                  Normalized: {JSON.stringify(photos, null, 2)}
                </pre>
                <div className="simple-debug__images">
                  {photos.map((url) => (
                    <img key={url} src={url} alt="Listing photo" />
                  ))}
                </div>
              </div>
            )}
            <div className="simple-detail__price">{formatPrice(listing.price)}</div>
            {estimatedEmi && (
              <div className="simple-detail__emi">
                Finance available from ₹{estimatedEmi.toLocaleString("en-IN")}/month
              </div>
            )}
            <div className="simple-detail__trust">
              <span>✓ Verified listing</span>
              <span>✓ {listing.dealer_id ? "Dealer" : "Owner"} verified</span>
              <span>✓ No hidden fees</span>
              <span>✓ Finance available</span>
              <span>✓ Insurance support</span>
            </div>
            <div className="simple-detail__cta-row">
              {supportLinks.tel ? (
                <a className="simple-button" href={supportLinks.tel}>
                  📞 Call SangroCars
                </a>
              ) : (
                <button className="simple-button" disabled>
                  📞 Call SangroCars
                </button>
              )}
              {supportLinks.whatsapp ? (
                <a
                  className="simple-button simple-button--secondary"
                  href={supportLinks.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                >
                  💬 WhatsApp SangroCars
                </a>
              ) : (
                <button className="simple-button simple-button--secondary" disabled>
                  💬 WhatsApp SangroCars
                </button>
              )}
              <a className="simple-button simple-button--secondary" href="#lead-form">
                📩 Request callback
              </a>
              <a
                className="simple-button simple-button--secondary"
                href={`?intent=best_price#lead-form`}
              >
                Request best price
              </a>
            </div>
            <div className="simple-detail__cta-row">
              <a className="simple-button" href={`?intent=finance#lead-form`}>
                💰 Finance this car
              </a>
              <a
                className="simple-button simple-button--secondary"
                href={`?intent=insurance#lead-form`}
              >
                🛡 Get insurance quote
              </a>
              <SaveToGarageButton
                listingId={listing.id}
                title={listingTitle}
                price={listing.price}
                location={listing.location}
                photo={getPrimaryPhoto(photos)}
              />
            </div>
            <div className="simple-detail__section assisted-buying">
              <h3>Buy with SangroCars assistance</h3>
              <ul>
                <li>Negotiation help to get the best price</li>
                <li>Finance support from trusted partners</li>
                <li>Insurance assistance in one call</li>
                <li>Verified seller checks before delivery</li>
              </ul>
            </div>
            <div className="simple-detail__section">
              <h3>Overview</h3>
              <p>{overviewDescription}</p>
            </div>
            <div className="simple-detail__section">
              <h3>Dynamic predictive pricing</h3>
              {predictivePricing ? (
                <>
                  <p>
                    Median price for this model:{" "}
                    <strong>{formatPrice(predictivePricing.median)}</strong> based on{" "}
                    {predictivePricing.total} similar live listings.
                  </p>
                  <p>{predictivePricing.recommendation}</p>
                </>
              ) : (
                <p>Not enough similar market data yet for price prediction.</p>
              )}
              <PersonalizedPriceSignal
                listingId={listing.id}
                currentPrice={listing.price}
                marketMedian={predictivePricing?.median ?? null}
              />
              {priceRange && (
                <div className="price-insight">
                  <div>
                    <p>Market price range</p>
                    <strong>
                      {formatPrice(priceRange.min)} — {formatPrice(priceRange.max)}
                    </strong>
                  </div>
                  <div>
                    <p>Your price</p>
                    <strong>{formatPrice(listing.price)}</strong>
                    {priceLabel && (
                      <span className="price-insight__badge">{priceLabel}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="simple-dealer-card">
              <div>
                <p className="simple-dealer-card__label">
                  Listed by
                </p>
                <h3>{dealerName}</h3>
                <p className="simple-dealer-card__meta">{dealerAddress}</p>
                <p className="simple-dealer-card__meta">
                  Verified by SangroCars
                </p>
                {dealer?.id && (
                  <Link
                    className="simple-link"
                    href={`/dealers/${dealerSlug(dealerName, dealer.id)}`}
                  >
                    View dealer profile
                  </Link>
                )}
                {dealer?.id && (
                  <div className="simple-dealer-card__badges">
                    <span className="simple-pill">Verified dealer</span>
                    <span className="simple-pill">Finance available</span>
                    <span className="simple-pill">Insurance support</span>
                    <span className="simple-pill">RC transfer help</span>
                    <span className="simple-pill">Responds in ~10 min</span>
                  </div>
                )}
              </div>
              <div className="simple-dealer-card__actions">
                {dealer?.id && (
                  <Link
                    className="simple-button simple-button--secondary"
                    href={`/dealers/${dealerSlug(dealerName, dealer.id)}`}
                  >
                    View dealer stock
                  </Link>
                )}
              </div>
            </div>
            <div className="simple-detail__section">
              <h3>Key specifications</h3>
              <div className="spec-grid">
                <div>
                  <span>Year</span>
                  <strong>{listing.year ?? "—"}</strong>
                </div>
                <div>
                  <span>Fuel</span>
                  <strong>{toTitle(listing.fuel) ?? "—"}</strong>
                </div>
                <div>
                  <span>Transmission</span>
                  <strong>{toTitle(listing.transmission) ?? "—"}</strong>
                </div>
                <div>
                  <span>Mileage</span>
                  <strong>{listing.km ? `${listing.km.toLocaleString("en-IN")} km` : "—"}</strong>
                </div>
                <div>
                  <span>Location</span>
                  <strong>{listing.location ?? "—"}</strong>
                </div>
                <div>
                  <span>Registration</span>
                  <strong>{listing.location?.split(",")[0] ?? "—"}</strong>
                </div>
              </div>
            </div>
            <div className="simple-detail__section">
              <h3>Vehicle highlights</h3>
              <ul className="highlight-list">
                {highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <EmiCalculator price={listing.price} />
            <div className="simple-detail__section" id="lead-form">
              <h3>Talk to SangroCars</h3>
              <LeadForm
                listingId={listing.id}
                dealerId={listing.dealer_id}
                listingTitle={listingTitle}
              />
            </div>
            {moreFromDealer.length > 0 && (
              <div className="simple-detail__section">
                <h3>More from {dealerName}</h3>
                <div className="listings">
                  {moreFromDealer.map((item) => {
                    const photo = getPrimaryPhoto(item.photo_urls);
                    const title = [
                      item.year ?? undefined,
                      toTitle(item.make),
                      toTitle(item.model),
                      toTitle(item.variant),
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <article className="listing" key={item.id}>
                        <div className="listing__media">
                          {photo ? (
                            <img src={photo} alt={title} />
                          ) : (
                            <div className="listing__placeholder" />
                          )}
                        </div>
                        <div className="listing__body">
                          <h3>{title}</h3>
                          <p className="listing__location">
                            {item.location || "Location on request"}
                          </p>
                          <div className="listing__meta">
                            {item.fuel && (
                              <span className="chip">{toTitle(item.fuel)}</span>
                            )}
                            {item.transmission && (
                              <span className="chip">
                                {toTitle(item.transmission)}
                              </span>
                            )}
                          </div>
                          <div className="listing__footer">
                            <strong>{formatPrice(item.price)}</strong>
                            <Link
                              className="btn btn--ghost btn--tight"
                              href={`/listing/${item.id}`}
                            >
                              View details
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
            {similarListings.length > 0 && (
              <div className="simple-detail__section">
                <h3>Similar cars near {listing.location?.split(",")[0] ?? "you"}</h3>
                <div className="listings">
                  {similarListings.map((item) => {
                    const photo = getPrimaryPhoto(item.photo_urls);
                    const title = [
                      item.year ?? undefined,
                      toTitle(item.make),
                      toTitle(item.model),
                      toTitle(item.variant),
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <article className="listing" key={item.id}>
                        <div className="listing__media">
                          {photo ? (
                            <img src={photo} alt={title} />
                          ) : (
                            <div className="listing__placeholder" />
                          )}
                        </div>
                        <div className="listing__body">
                          <h3>{title}</h3>
                          <p className="listing__location">
                            {item.location || "Location on request"}
                          </p>
                          <div className="listing__meta">
                            {item.fuel && (
                              <span className="chip">{toTitle(item.fuel)}</span>
                            )}
                            {item.transmission && (
                              <span className="chip">
                                {toTitle(item.transmission)}
                              </span>
                            )}
                          </div>
                          <div className="listing__footer">
                            <strong>{formatPrice(item.price)}</strong>
                            <Link
                              className="btn btn--ghost btn--tight"
                              href={`/listing/${item.id}`}
                            >
                              View details
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="simple-detail__section" id="report-listing">
              <h3>Report this listing</h3>
              <p>
                Something not right? Tell us and we&apos;ll review this listing.
              </p>
              <Link className="simple-link-btn" href="/support">
                Report a problem
              </Link>
            </div>
            <NearbyDealersMap
              listingDealerId={listing.dealer_id}
              listingLocation={listing.location}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
