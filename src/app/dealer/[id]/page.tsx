import Image from "next/image";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";

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

export default async function DealerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sb = supabaseServer();
  const { data: dealer, error } = await sb
    .from("dealers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !dealer) {
    return (
      <main className="home">
        <section className="section">
          <div className="section__header">
            <h2>Dealer not found</h2>
            <p>We could not find that dealer.</p>
          </div>
          <Link className="btn btn--solid" href="/listings">
            Back to search
          </Link>
        </section>
      </main>
    );
  }

  const { data: listings } = await sb
    .from("listings")
    .select(
      "id, make, model, variant, year, price, km, fuel, transmission, location, photo_urls"
    )
    .eq("dealer_id", id)
    .eq("status", "available")
    .order("last_seen_at", { ascending: false })
    .limit(12);

  const name =
    dealer.name ||
    dealer.dealer_name ||
    dealer.company_name ||
    "Dealer profile";
  const phone = dealer.phone || dealer.whatsapp || dealer.mobile || null;
  const phoneDigits = phone ? String(phone).replace(/\D/g, "") : null;
  const email = dealer.email || null;
  const address = dealer.address || dealer.location || "Address on request";
  const logoUrl = dealer.logo_url || dealer.logo || null;
  const totalListings = listings?.length ?? 0;
  const whatsappDigits = String(dealer.whatsapp ?? phone ?? "").replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(
    `Hi ${name}, I found your inventory on CarHub and would like details on available cars.`
  );
  const whatsappLink =
    whatsappDigits.length > 0
      ? `https://wa.me/${whatsappDigits}?text=${whatsappMessage}`
      : null;

  return (
    <main className="home">
      <section className="section dealer">
        <div className="section__header">
          <div className="dealer__headline">
            {logoUrl ? (
              <div className="dealer__logo">
                <Image
                  src={logoUrl}
                  alt={`${name} logo`}
                  width={96}
                  height={96}
                />
              </div>
            ) : null}
            <div>
              <h2>{name}</h2>
              <p>{address}</p>
            </div>
          </div>
          <div className="dealer__meta">
            <span className="chip">{totalListings} live listings</span>
            {phone && <span className="chip">Call: {phone}</span>}
            {email && <span className="chip">Email: {email}</span>}
          </div>
        </div>
        <div className="dealer__actions">
          <Link className="btn btn--solid" href="/listings">
            Browse all listings
          </Link>
          {phoneDigits ? (
            <a className="btn btn--outline" href={`tel:${phoneDigits}`}>
              Call dealer
            </a>
          ) : (
            <button className="btn btn--outline btn--disabled" disabled>
              Call dealer
            </button>
          )}
          {whatsappLink ? (
            <a
              className="btn btn--ghost"
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          ) : (
            <button className="btn btn--ghost btn--disabled" disabled>
              WhatsApp
            </button>
          )}
        </div>
      </section>

      <section className="section results">
        <div className="section__header">
          <div>
            <h2>Dealer inventory</h2>
            <p>Latest synced listings from this dealer.</p>
          </div>
        </div>
        <div className="listings">
          {totalListings === 0 ? (
            <div className="empty">No active listings for this dealer.</div>
          ) : (
            listings?.map((listing: Listing) => {
              const photo = listing.photo_urls?.[0];
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
                    <span className="listing__tag">Dealer sync</span>
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
      </section>
    </main>
  );
}
