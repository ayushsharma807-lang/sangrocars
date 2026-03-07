import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasSupabaseConfig, supabaseServerOptional } from "@/lib/supabase";
import { dealerIdFromSlug, dealerSlug } from "@/lib/dealerSlug";
import { getPrimaryPhoto } from "@/lib/photoUrls";

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
  photo_urls: string[] | null;
};

type DealerRow = {
  id: string;
  name?: string | null;
  dealer_name?: string | null;
  company_name?: string | null;
  address?: string | null;
  location?: string | null;
  logo_url?: string | null;
  logo?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
};

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

export default async function DealerProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dealerId = dealerIdFromSlug(slug);

  if (!hasSupabaseConfig()) {
    return (
      <main className="home">
        <section className="section">
          <div className="section__header">
            <h2>Dealer profile unavailable</h2>
            <p>Supabase is not configured for this deployment.</p>
          </div>
          <Link className="btn btn--solid" href="/listings">
            Back to listings
          </Link>
        </section>
      </main>
    );
  }

  const sb = supabaseServerOptional();
  if (!sb) {
    return (
      <main className="home">
        <section className="section">
          <div className="section__header">
            <h2>Dealer profile unavailable</h2>
            <p>Supabase is not configured for this deployment.</p>
          </div>
          <Link className="btn btn--solid" href="/listings">
            Back to listings
          </Link>
        </section>
      </main>
    );
  }

  if (!dealerId) {
    redirect("/dealers");
  }

  const { data: dealer, error } = await sb
    .from("dealers")
    .select("id, name, dealer_name, company_name, address, location, logo_url, logo, phone, whatsapp, email")
    .eq("id", dealerId)
    .single();

  if (error || !dealer) {
    redirect("/dealers");
  }

  const { data: listings } = await sb
    .from("listings")
    .select(
      "id, make, model, variant, year, price, km, fuel, transmission, location, photo_urls"
    )
    .eq("dealer_id", dealerId)
    .eq("status", "available")
    .order("last_seen_at", { ascending: false });

  const name =
    dealer.name || dealer.dealer_name || dealer.company_name || "Dealer";
  const address = dealer.address || dealer.location || "Address on request";
  const logoUrl = dealer.logo_url || dealer.logo || null;
  const phone = dealer.phone || dealer.whatsapp || null;
  const totalListings = listings?.length ?? 0;
  const whatsappDigits = String(dealer.whatsapp ?? phone ?? "").replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(
    `Hi ${name}, I found your inventory on SangroCars and want details.`
  );
  const whatsappLink =
    whatsappDigits.length > 0
      ? `https://wa.me/${whatsappDigits}?text=${whatsappMessage}`
      : null;

  return (
    <main className="home">
      <section className="section dealer-profile">
        <div className="dealer-profile__hero">
          <div className="dealer-profile__headline">
            {logoUrl ? (
              <div className="dealer-profile__logo">
                <Image
                  src={logoUrl}
                  alt={`${name} logo`}
                  width={96}
                  height={96}
                />
              </div>
            ) : (
              <div className="dealer-profile__logo dealer-profile__logo--fallback">
                {name.charAt(0)}
              </div>
            )}
            <div>
              <h1>{name}</h1>
              <p>{address}</p>
              <div className="dealer-profile__badges">
                <span className="chip">Verified dealer</span>
                <span className="chip">Finance available</span>
                <span className="chip">Insurance support</span>
                <span className="chip">RC transfer help</span>
              </div>
            </div>
          </div>
          <div className="dealer-profile__actions">
            <Link className="btn btn--solid" href={`/dealer/${dealer.id}`}>
              View dealer stock
            </Link>
            <Link className="btn btn--outline" href="/listings">
              Browse all listings
            </Link>
            {phone ? (
              <a className="btn btn--ghost" href={`tel:${phone.replace(/\D/g, "")}`}>
                Call dealer
              </a>
            ) : null}
            {whatsappLink ? (
              <a className="btn btn--ghost" href={whatsappLink} target="_blank" rel="noreferrer">
                WhatsApp dealer
              </a>
            ) : null}
          </div>
        </div>

        <div className="dealer-profile__stats">
          <div>
            <strong>{totalListings}</strong>
            <span>Active listings</span>
          </div>
          <div>
            <strong>4 yrs</strong>
            <span>Years in business</span>
          </div>
          <div>
            <strong>95%</strong>
            <span>Response rate</span>
          </div>
        </div>

        <div className="dealer-profile__about">
          <h3>About {name}</h3>
          <p>
            Premium inventory, verified documents, and direct assistance for finance
            and insurance. We focus on quality listings and fast response times.
          </p>
          <div className="dealer-profile__services">
            <span>Finance assistance</span>
            <span>Insurance support</span>
            <span>RC transfer help</span>
            <span>Documentation support</span>
          </div>
        </div>

        <div className="dealer-profile__inventory">
          <div className="section__header">
            <div>
              <h2>Dealer inventory</h2>
              <p>All active listings from this dealer.</p>
            </div>
            <span className="section-pill">{totalListings} cars</span>
          </div>
          <div className="listings">
            {totalListings === 0 ? (
              <div className="empty">No active listings for this dealer.</div>
            ) : (
              listings?.map((listing: Listing) => {
                const photo = getPrimaryPhoto(listing.photo_urls);
                const titleParts = [
                  listing.year ?? undefined,
                  toTitle(listing.make),
                  toTitle(listing.model),
                  toTitle(listing.variant),
                ].filter(Boolean);
                return (
                  <article className="listing" key={listing.id}>
                    <div className="listing__media">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={String(listing.model ?? "Car")}
                          fill
                          sizes="(max-width: 980px) 100vw, 33vw"
                          className="listing__image"
                        />
                      ) : (
                        <div className="listing__placeholder" />
                      )}
                      <span className="listing__tag">Dealer</span>
                    </div>
                    <div className="listing__body">
                      <h3>{titleParts.join(" ")}</h3>
                      <p className="listing__location">
                        {listing.location || "Location on request"}
                      </p>
                      <div className="listing__meta">
                        {listing.fuel && (
                          <span className="chip">{toTitle(listing.fuel)}</span>
                        )}
                        {listing.transmission && (
                          <span className="chip">
                            {toTitle(listing.transmission)}
                          </span>
                        )}
                        {listing.km && (
                          <span className="chip">
                            {listing.km.toLocaleString("en-IN")} km
                          </span>
                        )}
                      </div>
                      <div className="listing__footer">
                        <strong>{formatPrice(listing.price)}</strong>
                        <Link
                          className="btn btn--ghost btn--tight"
                          href={`/listing/${listing.id}`}
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        <div className="dealer-profile__footer">
          <Link className="btn btn--outline" href={`/dealer/${dealer.id}`}>
            View dealer stock page
          </Link>
          <Link className="btn btn--ghost" href={`/dealers/${dealerSlug(name, dealer.id)}`}>
            Share profile
          </Link>
        </div>
      </section>
    </main>
  );
}
