import Link from "next/link";
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

const buildWhatsAppLink = (value?: string | null, message?: string) => {
  const digits = normalizePhone(value);
  if (!digits) return null;
  const text = encodeURIComponent(
    message ?? "Hi, I'm interested in this car on CarHub."
  );
  return `https://wa.me/${digits}?text=${text}`;
};

const formatListingMeta = (listing: Listing) => {
  const parts = [
    listing.fuel ? toTitle(listing.fuel) : null,
    listing.transmission ? toTitle(listing.transmission) : null,
    listing.km ? `${listing.km.toLocaleString("en-IN")} km` : null,
  ].filter(Boolean) as string[];

  return parts.join(", ");
};

const buildListingMessage = (
  listing: Listing,
  dealerName: string,
  title: string
) => {
  const location = listing.location ? ` in ${listing.location}` : "";
  const priceText = formatPrice(listing.price);
  const meta = formatListingMeta(listing);
  const parts = [
    `Hi ${dealerName}, I'm interested in the ${title}${location}.`,
    `Price shown: ${priceText}.`,
    meta ? `Details: ${meta}.` : null,
    "Is it still available? Please share the best offer and inspection report.",
  ].filter(Boolean) as string[];

  return parts.join(" ");
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
      "id, dealer_id, make, model, variant, year, price, km, fuel, transmission, location, description, photo_urls, type"
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

  const dealerName =
    dealer?.name ?? privateSeller.seller.name ?? "Private seller";
  const dealerPhone =
    dealer?.phone ?? dealer?.whatsapp ?? privateSeller.seller.phone ?? null;
  const dealerEmail = dealer?.email ?? privateSeller.seller.email ?? null;
  const dealerAddress = dealer?.address ?? listing.location ?? "Address on request";
  const dealerPhoneDigits = normalizePhone(dealerPhone);
  const whatsappLink = buildWhatsAppLink(
    dealer?.whatsapp ?? dealer?.phone ?? privateSeller.seller.phone,
    buildListingMessage(listing, dealerName, listingTitle)
  );
  const telLink = dealerPhoneDigits ? `tel:${dealerPhoneDigits}` : null;
  const mailLink = dealerEmail ? `mailto:${dealerEmail}` : null;

  return (
    <main className="simple-page simple-detail-page">
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
            </div>
            <div className="simple-dealer-card">
              <div>
                <p className="simple-dealer-card__label">
                  {dealer?.id ? "Dealer" : "Seller"}
                </p>
                <h3>{dealerName}</h3>
                <p className="simple-dealer-card__meta">{dealerAddress}</p>
                {dealerPhone && (
                  <p className="simple-dealer-card__meta">Phone: {dealerPhone}</p>
                )}
                {dealerEmail && (
                  <p className="simple-dealer-card__meta">Email: {dealerEmail}</p>
                )}
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
                  </div>
                )}
              </div>
              <div className="simple-dealer-card__actions">
                {telLink ? (
                  <a className="simple-button simple-button--secondary" href={telLink}>
                    {dealer?.id ? "Call dealer" : "Call seller"}
                  </a>
                ) : (
                  <button
                    className="simple-button simple-button--secondary"
                    disabled
                  >
                    {dealer?.id ? "Call dealer" : "Call seller"}
                  </button>
                )}
                {whatsappLink ? (
                  <a
                    className="simple-button"
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {dealer?.id ? "WhatsApp dealer" : "WhatsApp seller"}
                  </a>
                ) : (
                  <button className="simple-button" disabled>
                    {dealer?.id ? "WhatsApp dealer" : "WhatsApp seller"}
                  </button>
                )}
                {mailLink ? (
                  <a className="simple-link-btn" href={mailLink}>
                    {dealer?.id ? "Email dealer" : "Email seller"}
                  </a>
                ) : (
                  <button className="simple-link-btn" disabled>
                    {dealer?.id ? "Email dealer" : "Email seller"}
                  </button>
                )}
                {dealer?.id && (
                  <Link
                    className="simple-button simple-button--secondary"
                    href={`/dealers/${dealerSlug(dealerName, dealer.id)}`}
                  >
                    View dealer stock
                  </Link>
                )}
                <a className="simple-button simple-button--secondary" href="#finance-request">
                  Finance this car
                </a>
                <a className="simple-button simple-button--secondary" href="#finance-request">
                  Get insurance
                </a>
              </div>
            </div>
            <EmiCalculator price={listing.price} />
            <div className="simple-detail__section" id="finance-request">
              <h3>Request callback / finance</h3>
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
