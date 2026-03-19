import Link from "next/link";
import type { Metadata } from "next";
import { hasSupabaseConfig, supabaseServerOptional } from "@/lib/supabase";
import { parsePrivateSellerDescription } from "@/lib/privateSeller";
import { parseListingExperienceDescription } from "@/lib/listingExperience";
import ListingGallery from "./ListingGallery";
import LeadModal from "./LeadModal";
import EmiModal from "./EmiModal";
import NearbyDealersMap from "./NearbyDealersMap";
import SaveToGarageButton from "@/app/components/SaveToGarageButton";
import RecentViewTracker from "@/app/components/RecentViewTracker";
import { getPrimaryPhoto, normalizePhotoUrls } from "@/lib/photoUrls";
import { isListingPendingApproval } from "@/lib/listingApproval";
import { extractDealerCode } from "@/lib/dealerCode";
import {
  formatLocationTitle,
  formatPriceCompact,
  formatKm,
  isNewArrival,
  titleCase,
} from "@/lib/listingDisplay";

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
  created_at: string | null;
};

type Dealer = {
  id: string;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  description: string | null;
};

const publicDealerLabel = (code?: string | null) =>
  code ? `Dealer ID ${code}` : "Verified dealer";

const buildHighlightLink = (
  label: string,
  listing: Pick<Listing, "fuel" | "location" | "type">
) => {
  if (label.toLowerCase().includes("powertrain") && listing.fuel) {
    return `/listings?fuel=${encodeURIComponent(listing.fuel)}`;
  }

  if (label === "Verified documents") {
    return "/contact#contact-sangrocars";
  }

  if (listing.type) {
    return `/listings?type=${encodeURIComponent(listing.type)}`;
  }

  if (listing.location) {
    return `/listings?city=${encodeURIComponent(listing.location)}`;
  }

  return "/listings";
};

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

const formatPrice = formatPriceCompact;
const toTitle = titleCase;

const normalizePhone = (value?: string | null) => {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const buildSupportLinks = (
  listingTitle: string,
  listingUrl: string,
  listingId: string
) => {
  const raw =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ??
    process.env.NEXT_PUBLIC_SANGRO_PHONE ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    "";
  const digits = normalizePhone(raw);
  const message = encodeURIComponent(
    `Hi, I'm interested in listing ${listingId} (${listingTitle}) on SangroCars. ${listingUrl}`
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
      "id, dealer_id, make, model, variant, year, price, km, fuel, transmission, location, description, photo_urls, type, status, created_at"
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
  const isPendingApproval = isListingPendingApproval(listing);
  if ((listing.status && listing.status !== "available") || isPendingApproval) {
    return (
      <main className="simple-page simple-detail-page">
        <section className="simple-shell">
          <div className="simple-header">
            <h2>
              {isPendingApproval
                ? "Listing awaiting approval"
                : "Listing not available"}
            </h2>
            <p>
              {isPendingApproval
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

  let dealer: Dealer | null = null;
  if (listing.dealer_id) {
    const { data: dealerData, error: dealerError } = await sb
      .from("dealers")
      .select("id, name, phone, whatsapp, email, address, description")
      .eq("id", listing.dealer_id)
      .single();
    if (!dealerError && dealerData) {
      dealer = dealerData as Dealer;
    }
  }
  const dealerCode = extractDealerCode(dealer?.description);
  const publicDealerName = publicDealerLabel(dealerCode);
  let moreFromDealer: Listing[] = [];
  if (listing.dealer_id) {
    const { data: moreRows } = await sb
      .from("listings")
      .select(
        "id, make, model, variant, year, price, km, fuel, transmission, location, photo_urls, created_at"
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
        "id, make, model, variant, year, price, km, fuel, transmission, location, photo_urls, created_at"
      )
      .eq("status", "available")
      .neq("id", listing.id);
    if (listing.make) query = query.ilike("make", `%${listing.make}%`);
    if (listing.model) query = query.ilike("model", `%${listing.model}%`);
    if (city) query = query.ilike("location", `%${city}%`);
    const { data: similarRows } = await query.limit(4);
    similarListings = (similarRows ?? []) as Listing[];
  }

  const dealerAddress =
    formatLocationTitle(dealer?.address ?? listing.location) ?? "Address on request";
  const supportLinks = buildSupportLinks(listingTitle, listingUrl, listing.id);
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
  return (
    <main className="simple-page simple-detail-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
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
              <p>{formatLocationTitle(listing.location) || "Location on request"}</p>
              {quickMeta.length > 0 && (
                <p className="listing-hero__meta">{quickMeta.join(" · ")}</p>
              )}
            </div>
          </div>
          <div className="listing-hero__actions">
            <SaveToGarageButton
              listingId={listing.id}
              title={listingTitle}
              price={listing.price}
              location={listing.location}
              photo={getPrimaryPhoto(photos)}
              iconOnly
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
            <Link
              className="simple-pill simple-pill--link"
              href={`/listings?type=${encodeURIComponent(listing.type)}`}
            >
              {toTitle(listing.type)}
            </Link>
          )}
          {listing.fuel && (
            <Link
              className="simple-pill simple-pill--link"
              href={`/listings?fuel=${encodeURIComponent(listing.fuel)}`}
            >
              {toTitle(listing.fuel)}
            </Link>
          )}
          {listing.transmission && (
            <Link
              className="simple-pill simple-pill--link"
              href={`/listings?transmission=${encodeURIComponent(listing.transmission)}`}
            >
              {toTitle(listing.transmission)}
            </Link>
          )}
          {listing.km && (
            <Link className="simple-pill simple-pill--link" href="/listings?sort=recent">
              {formatKm(listing.km)}
            </Link>
          )}
        </div>
        <div className="simple-detail__layout">
          <div className="simple-detail__panel simple-detail__panel--gallery">
            <ListingGallery photos={photos} alt={listingTitle} />
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
          </div>
          <aside className="simple-detail__panel simple-detail__panel--sidebar">
            <div className="detail-sidebar__price">
              <div className="detail-sidebar__amount">
                {formatPrice(listing.price)}
              </div>
              {estimatedEmi && (
                <div className="detail-sidebar__emi">
                  Finance from ₹{estimatedEmi.toLocaleString("en-IN")}/month
                </div>
              )}
            </div>
            <div className="detail-sidebar__trust">
              <span>✓ Verified listing</span>
              <span>✓ SangroCars assisted deal</span>
              <span>✓ Finance & insurance support</span>
            </div>
            <div className="detail-sidebar__cta">
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
              <LeadModal
                label="Request best price"
                listingId={listing.id}
                dealerId={listing.dealer_id}
                listingTitle={listingTitle}
                defaultIntent="best_price"
                variant="secondary"
              />
              <EmiModal price={listing.price} />
            </div>
            <div className="detail-sidebar__listed">
              <p className="detail-sidebar__label">LISTED BY</p>
              <strong>{dealer?.id ? publicDealerName : "Private seller"}</strong>
              <span>📍 {dealerAddress}</span>
              <span>✓ Verified by SangroCars</span>
              <span>Usually responds within 10 minutes</span>
            </div>
            <div className="detail-sidebar__assist">
              <p>Buy with SangroCars assistance</p>
              <ul>
                <li>Negotiation help to get the best price</li>
                <li>Finance support from trusted partners</li>
                <li>Insurance assistance in one call</li>
              </ul>
            </div>
          </aside>
        </div>
        <div className="simple-detail__section">
          <h3>Overview</h3>
          <p>{overviewDescription}</p>
        </div>
        <div className="simple-detail__section">
          <h3>Key specs</h3>
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
              <strong>{listing.km ? formatKm(listing.km) : "—"}</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>{formatLocationTitle(listing.location) ?? "—"}</strong>
            </div>
          </div>
          {highlights.length > 0 && (
            <div className="spec-highlights">
              {highlights.map((item) => (
                <Link
                  key={item}
                  className="spec-highlight spec-highlight--link"
                  href={buildHighlightLink(item, listing)}
                >
                  {item}
                </Link>
              ))}
            </div>
          )}
        </div>
        {moreFromDealer.length > 0 && (
          <div className="simple-detail__section">
            <h3>Similar Cars You May Like</h3>
            <div className="listings">
              {moreFromDealer.map((item) => {
                const photo = getPrimaryPhoto(item.photo_urls);
                const isFresh = isNewArrival(item.created_at);
                const title = [
                  item.year ?? undefined,
                  toTitle(item.make),
                  toTitle(item.model),
                  toTitle(item.variant),
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <article className="listing listing--suggested" key={item.id}>
                    <div className="listing__media">
                      {isFresh && (
                        <Link className="listing__tag listing__tag--link" href="/listings?sort=recent">
                          Just Added
                        </Link>
                      )}
                      {photo ? (
                        <img src={photo} alt={title} />
                      ) : (
                        <div className="listing__placeholder" />
                      )}
                    </div>
                    <div className="listing__body">
                      <h3>{title}</h3>
                      <p className="listing__location">
                        {[toTitle(item.fuel), toTitle(item.transmission)]
                          .filter(Boolean)
                          .join(" • ") || "Specs on request"}
                      </p>
                      <div className="listing__meta listing__meta--stacked">
                        <span className="listing__detail-line">
                          {formatKm(item.km)}
                        </span>
                        <span className="listing__detail-city">
                          {formatLocationTitle(item.location) ?? "Location on request"}
                        </span>
                      </div>
                      <div className="listing__footer">
                        <strong>{formatPrice(item.price)}</strong>
                        <Link
                          className="btn btn--ghost btn--tight listing__cta"
                          href={`/listing/${item.id}`}
                        >
                          View Details →
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
            <h3>
              More cars near {formatLocationTitle(listing.location?.split(",")[0] ?? null) ?? "you"}
            </h3>
            <div className="listings">
              {similarListings.map((item) => {
                const photo = getPrimaryPhoto(item.photo_urls);
                const isFresh = isNewArrival(item.created_at);
                const title = [
                  item.year ?? undefined,
                  toTitle(item.make),
                  toTitle(item.model),
                  toTitle(item.variant),
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <article className="listing listing--suggested" key={item.id}>
                    <div className="listing__media">
                      {isFresh && (
                        <Link className="listing__tag listing__tag--link" href="/listings?sort=recent">
                          Just Added
                        </Link>
                      )}
                      {photo ? (
                        <img src={photo} alt={title} />
                      ) : (
                        <div className="listing__placeholder" />
                      )}
                    </div>
                    <div className="listing__body">
                      <h3>{title}</h3>
                      <p className="listing__location">
                        {[toTitle(item.fuel), toTitle(item.transmission)]
                          .filter(Boolean)
                          .join(" • ") || "Specs on request"}
                      </p>
                      <div className="listing__meta listing__meta--stacked">
                        <span className="listing__detail-line">
                          {formatKm(item.km)}
                        </span>
                        <span className="listing__detail-city">
                          {formatLocationTitle(item.location) ?? "Location on request"}
                        </span>
                      </div>
                      <div className="listing__footer">
                        <strong>{formatPrice(item.price)}</strong>
                        <Link
                          className="btn btn--ghost btn--tight listing__cta"
                          href={`/listing/${item.id}`}
                        >
                          View Details →
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
      </section>
    </main>
  );
}
