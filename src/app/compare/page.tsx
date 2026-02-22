import Image from "next/image";
import Link from "next/link";
import { hasSupabaseConfig, supabaseServerOptional } from "@/lib/supabase";

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
  photo_urls: string[] | null;
};

const toTitle = (value: string | null) => {
  if (!value) return "—";
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatPrice = (value: number | null) =>
  value ? `₹${value.toLocaleString("en-IN")}` : "Price on request";

const parseIds = (raw?: string) => {
  if (!raw) return [] as string[];
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  ).slice(0, 3);
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams?: Promise<{ ids?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const ids = parseIds(params.ids);

  if (ids.length === 0) {
    return (
      <main className="simple-page">
        <section className="simple-shell">
          <div className="simple-header">
            <div>
              <h1>Compare cars</h1>
              <p>Select 2-3 cars from listings to compare.</p>
            </div>
            <Link className="simple-link" href="/listings">
              Back to listings
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!hasSupabaseConfig()) {
    return (
      <main className="simple-page">
        <section className="simple-shell">
          <div className="simple-header">
            <div>
              <h1>Compare cars</h1>
              <p>Comparison is unavailable without Supabase configuration.</p>
            </div>
            <Link className="simple-link" href="/listings">
              Back to listings
            </Link>
          </div>
        </section>
      </main>
    );
  }
  const sb = supabaseServerOptional();
  if (!sb) {
    return (
      <main className="simple-page">
        <section className="simple-shell">
          <div className="simple-header">
            <div>
              <h1>Compare cars</h1>
              <p>Comparison is unavailable without Supabase configuration.</p>
            </div>
            <Link className="simple-link" href="/listings">
              Back to listings
            </Link>
          </div>
        </section>
      </main>
    );
  }
  const { data } = await sb
    .from("listings")
    .select(
      "id, dealer_id, make, model, variant, year, price, km, fuel, transmission, location, photo_urls"
    )
    .in("id", ids);

  const listings = (data ?? []) as Listing[];
  const orderedListings = ids
    .map((id) => listings.find((item) => item.id === id))
    .filter((item): item is Listing => Boolean(item));

  const dealerIds = Array.from(
    new Set(
      orderedListings.map((item) => item.dealer_id).filter((item): item is string => Boolean(item))
    )
  );
  const dealerMap = new Map<string, string>();
  if (dealerIds.length > 0) {
    const { data: dealerRows } = await sb
      .from("dealers")
      .select("id, name")
      .in("id", dealerIds);
    for (const dealer of dealerRows ?? []) {
      if (dealer.id) dealerMap.set(String(dealer.id), String(dealer.name ?? "Dealer"));
    }
  }

  const rows = [
    {
      label: "Price",
      getValue: (listing: Listing) => formatPrice(listing.price),
    },
    {
      label: "Year",
      getValue: (listing: Listing) => (listing.year ? String(listing.year) : "—"),
    },
    {
      label: "Fuel",
      getValue: (listing: Listing) => toTitle(listing.fuel),
    },
    {
      label: "Transmission",
      getValue: (listing: Listing) => toTitle(listing.transmission),
    },
    {
      label: "KM driven",
      getValue: (listing: Listing) =>
        listing.km ? `${listing.km.toLocaleString("en-IN")} km` : "—",
    },
    {
      label: "Location",
      getValue: (listing: Listing) => listing.location || "—",
    },
    {
      label: "Dealer",
      getValue: (listing: Listing) =>
        listing.dealer_id ? dealerMap.get(listing.dealer_id) ?? "Dealer" : "Dealer",
    },
  ];

  return (
    <main className="simple-page">
      <section className="simple-shell">
        <div className="simple-header">
          <div>
            <h1>Compare cars</h1>
            <p>{orderedListings.length} selected.</p>
          </div>
          <div className="simple-detail__top-actions">
            <Link className="simple-link" href="/listings">
              Back to listings
            </Link>
            {orderedListings.length > 0 && (
              <Link
                className="simple-link-btn"
                href={`/listings?compare=${orderedListings
                  .map((item) => item.id)
                  .join(",")}`}
              >
                Add another car
              </Link>
            )}
          </div>
        </div>

        {orderedListings.length < 2 ? (
          <div className="simple-empty">
            <p>Add one more car to compare side by side.</p>
            <Link
              className="simple-button simple-button--secondary"
              href={`/listings?compare=${orderedListings
                .map((item) => item.id)
                .join(",")}`}
            >
              Add another car
            </Link>
          </div>
        ) : (
          <div className="compare-grid">
            {orderedListings.map((listing) => {
              const title = [
                listing.year ?? undefined,
                toTitle(listing.make),
                toTitle(listing.model),
                toTitle(listing.variant),
              ]
                .filter((item) => item && item !== "—")
                .join(" ");
              const photo = listing.photo_urls?.[0];
              return (
                <article className="compare-card" key={listing.id}>
                  <div className="compare-card__media">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={title || "Car"}
                        fill
                        sizes="(max-width: 980px) 100vw, 33vw"
                        className="compare-card__image"
                      />
                    ) : (
                      <div className="compare-card__placeholder" />
                    )}
                  </div>
                  <h3>{title || "Listing"}</h3>
                  <p>{formatPrice(listing.price)}</p>
                  <Link className="simple-link-btn" href={`/listing/${listing.id}`}>
                    View details
                  </Link>
                </article>
              );
            })}
          </div>
        )}

        {orderedListings.length > 0 && (
          <div className="compare-table">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>Spec</th>
                  {orderedListings.map((listing) => (
                    <th key={listing.id}>
                      {toTitle(listing.make)} {toTitle(listing.model)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    {orderedListings.map((listing) => (
                      <td key={`${row.label}-${listing.id}`}>
                        {row.getValue(listing)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
