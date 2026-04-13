import Link from "next/link";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseServer } from "@/lib/supabase";
import { getPrimaryPhoto, normalizePhotoUrls } from "@/lib/photoUrls";
import { formatPriceCompact, formatKm, titleCase } from "@/lib/listingDisplay";
import InstagramComposer from "./InstagramComposer";

type ListingRow = {
  id: string;
  make: string | null;
  model: string | null;
  variant: string | null;
  year: number | null;
  fuel: string | null;
  transmission: string | null;
  km: number | null;
  price: number | null;
  location: string | null;
  photo_urls: string[] | null;
  instagram_post_status: string | null;
  instagram_posted_at: string | null;
  instagram_caption: string | null;
};

const buildCaption = (listing: ListingRow, listingUrl: string) => {
  const title = [
    listing.year ?? undefined,
    titleCase(listing.make),
    titleCase(listing.model),
    titleCase(listing.variant),
  ]
    .filter(Boolean)
    .join(" ");

  const lines = [
    title || "SangroCars Listing",
    listing.year ? `Year: ${listing.year}` : null,
    listing.km ? `KM: ${formatKm(listing.km)}` : null,
    listing.fuel ? `Fuel: ${titleCase(listing.fuel)}` : null,
    listing.transmission
      ? `Transmission: ${titleCase(listing.transmission)}`
      : null,
    listing.price
      ? `Price: ${formatPriceCompact(listing.price)}`
      : "Price: On request",
    "Finance available",
    `View more: ${listingUrl}`,
    "DM now or contact SangroCars",
  ].filter(Boolean);

  return lines.join("\n");
};

export default async function InstagramPostPage({
  params,
}: {
  params: { id: string };
}) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return (
      <main className="home admin">
        <section className="section admin">
          <div className="admin-banner admin-banner--error">
            Access denied.
          </div>
          <Link className="btn btn--ghost" href="/admin/login">
            Back to login
          </Link>
        </section>
      </main>
    );
  }

  const sb = supabaseServer();
  const { data } = await sb
    .from("listings")
    .select(
      "id, make, model, variant, year, fuel, transmission, km, price, location, photo_urls, instagram_post_status, instagram_posted_at, instagram_caption"
    )
    .eq("id", params.id)
    .single();

  if (!data) {
    return (
      <main className="home admin">
        <section className="section admin">
          <div className="admin-banner admin-banner--error">Listing not found.</div>
          <Link className="btn btn--ghost" href="/admin/listings">
            Back to listings
          </Link>
        </section>
      </main>
    );
  }

  const listing = data as ListingRow;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sangrocars.in";
  const listingUrl = `${siteUrl}/listing/${listing.id}`;
  const photos = normalizePhotoUrls(listing.photo_urls);
  const mainImage = getPrimaryPhoto(photos);
  const caption = listing.instagram_caption || buildCaption(listing, listingUrl);

  return (
    <main className="home admin">
      <section className="section admin">
        <div className="section__header">
          <div>
            <h2>Post to Instagram</h2>
            <p>Prepare the caption and image for Business Suite.</p>
          </div>
          <Link className="btn btn--ghost" href="/admin/listings">
            Back to listings
          </Link>
        </div>
        <InstagramComposer
          listingId={listing.id}
          caption={caption}
          imageUrl={mainImage}
          listingUrl={listingUrl}
          status={listing.instagram_post_status}
          postedAt={listing.instagram_posted_at}
        />
      </section>
    </main>
  );
}
