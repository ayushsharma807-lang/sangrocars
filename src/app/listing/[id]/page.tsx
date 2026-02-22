import Link from "next/link";
import { hasSupabaseConfig, supabaseServerOptional } from "@/lib/supabase";
import { parsePrivateSellerDescription } from "@/lib/privateSeller";
import { parseListingExperienceDescription } from "@/lib/listingExperience";
import ListingGallery from "./ListingGallery";
import LeadForm from "./LeadForm";
import EmiCalculator from "./EmiCalculator";
import NearbyDealersMap from "./NearbyDealersMap";
import CarConfigurator from "@/app/components/CarConfigurator";
import TradeInValuator from "@/app/components/TradeInValuator";
import WebArViewer from "@/app/components/WebArViewer";
import SaveToGarageButton from "@/app/components/SaveToGarageButton";
import RecentViewTracker from "@/app/components/RecentViewTracker";
import PersonalizedPriceSignal from "@/app/components/PersonalizedPriceSignal";
import { getBrandArModel } from "@/lib/arModels";

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

const normalizeVideoUrl = (value?: string | null) => {
  if (!value) return null;
  const url = value.trim();
  if (!url) return null;
  if (url.includes("/embed/")) return url;
  if (url.includes("youtube.com/watch")) {
    try {
      const parsed = new URL(url);
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    } catch {
      return url;
    }
  }
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    if (id) return `https://www.youtube.com/embed/${id}`;
  }
  return url;
};

const isVideoFile = (value?: string | null) => {
  if (!value) return false;
  const lowered = value.toLowerCase();
  return lowered.endsWith(".mp4") || lowered.endsWith(".webm") || lowered.endsWith(".ogg");
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
  const photos = listing.photo_urls ?? [];
  const listingTitle = titleParts.join(" ") || "Car listing";
  const walkthroughUrl = normalizeVideoUrl(
    experienceInfo.meta.walkthroughVideoUrl ?? experienceInfo.meta.tour360Url
  );
  const interiorVrUrl = normalizeVideoUrl(experienceInfo.meta.interiorVrUrl);
  const fallbackArModel = getBrandArModel(listing.make);
  const arModelUrl = experienceInfo.meta.arModelUrl ?? fallbackArModel?.modelUrl ?? null;
  const arIosModelUrl =
    experienceInfo.meta.arIosModelUrl ?? fallbackArModel?.iosModelUrl ?? null;
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
        <div className="simple-header">
          <div>
            <h1>{titleParts.join(" ")}</h1>
            <p>{listing.location || "Location on request"}</p>
          </div>
          <div className="simple-detail__top-actions">
            <Link className="simple-link" href="/listings">
              Back to listings
            </Link>
            <Link className="simple-link" href={`/compare?ids=${listing.id}`}>
              Compare this car
            </Link>
            <SaveToGarageButton
              listingId={listing.id}
              title={listingTitle}
              price={listing.price}
              location={listing.location}
              photo={photos[0] ?? null}
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
            <div className="simple-detail__section">
              <h3>Interactive tools</h3>
              <p>Tap a button to jump to details at the bottom.</p>
              <div className="simple-mini-btn-row">
                <a className="simple-mini-btn" href="#walkthrough-360">
                  360 walkthrough
                </a>
                <a className="simple-mini-btn" href="#ar-view">
                  AR placement
                </a>
                <a className="simple-mini-btn" href="#build-config">
                  Build config
                </a>
                <a className="simple-mini-btn" href="#trade-in-instant">
                  Trade-in value
                </a>
              </div>
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
                  <Link className="simple-link" href={`/dealer/${dealer.id}`}>
                    View dealer profile
                  </Link>
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
            <NearbyDealersMap
              listingDealerId={listing.dealer_id}
              listingLocation={listing.location}
            />
            <div className="simple-detail__section simple-detail__section--feature" id="walkthrough-360">
              <h3>360 walkthrough</h3>
              {walkthroughUrl ? (
                <div className="experience-embed">
                  {isVideoFile(walkthroughUrl) ? (
                    <video controls src={walkthroughUrl} />
                  ) : (
                    <iframe
                      src={walkthroughUrl}
                      title={`${listingTitle} walkthrough`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                </div>
              ) : (
                <div className="experience-empty">
                  Walkthrough video will appear here after dealer upload.
                </div>
              )}
              {interiorVrUrl && (
                <a className="simple-link-btn" href={interiorVrUrl} target="_blank" rel="noreferrer">
                  Open interior VR tour
                </a>
              )}
            </div>
            <div className="simple-detail__section simple-detail__section--feature" id="ar-view">
              <h3>AR virtual placement</h3>
              <WebArViewer
                modelUrl={arModelUrl}
                iosModelUrl={arIosModelUrl}
                title={listingTitle}
                posterUrl={photos[0] ?? undefined}
              />
            </div>
            <div className="simple-detail__section simple-detail__section--feature" id="build-config">
              <h3>Build your configuration</h3>
              <CarConfigurator
                basePrice={listing.price}
                title={listingTitle}
                listingId={listing.id}
              />
            </div>
            <div className="simple-detail__section simple-detail__section--feature" id="trade-in-instant">
              <h3>Instant trade-in value</h3>
              <TradeInValuator
                make={listing.make}
                model={listing.model}
                currentPrice={listing.price}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
