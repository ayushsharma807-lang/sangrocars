import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import {
  isListingPendingApproval,
  stripListingInternalMeta,
} from "@/lib/listingApproval";

type DealerOption = {
  id: string;
  name: string | null;
};

const joinPhotos = (photos?: string[] | null) => photos?.join("\n") ?? "";

export default async function AdminEditListingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; status?: string }>;
}) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect("/admin/login?error=unauthorized");
  }

  const { id } = await params;
  const query = await searchParams;
  const sb = supabaseServer();

  const [{ data: listing, error }, { data: dealers }] = await Promise.all([
    sb
      .from("listings")
      .select(
        "id, dealer_id, type, status, make, model, variant, year, price, km, fuel, transmission, location, description, photo_urls"
      )
      .eq("id", id)
      .single(),
    sb.from("dealers").select("id, name").order("name", { ascending: true }).limit(2000),
  ]);

  if (error || !listing) {
    redirect("/admin/listings");
  }

  const dealerOptions = (dealers ?? []) as DealerOption[];
  const isPending = isListingPendingApproval(listing);

  return (
    <main className="home">
      <section className="section admin">
        <div className="section__header">
          <div>
            <h2>Edit listing</h2>
            <p>Update any listing from the admin side.</p>
          </div>
          <div className="dealer__actions">
            <Link className="btn btn--ghost" href="/admin/dealers">
              Dealers
            </Link>
            <Link className="btn btn--ghost" href="/admin/listings">
              All ads
            </Link>
            <Link className="btn btn--outline" href={`/listing/${listing.id}`}>
              View listing
            </Link>
            <Link className="btn btn--solid" href="/">
              Back to home
            </Link>
          </div>
        </div>

        {query.status === "saved" ? (
          <div className="admin-banner">Listing updated successfully.</div>
        ) : null}
        {query.error ? (
          <div className="admin-banner admin-banner--error">{decodeURIComponent(query.error)}</div>
        ) : null}

        <form className="dealer-form" method="post" action={`/api/admin/listings/${listing.id}`}>
          <div className="dealer-form__grid">
            <label>
              Dealer account
              <select name="dealer_id" defaultValue={listing.dealer_id ?? "none"}>
                <option value="none">No dealer (private seller / ad-hoc)</option>
                {dealerOptions.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.name || dealer.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select name="type" defaultValue={listing.type ?? "used"}>
                <option value="used">Used</option>
                <option value="new">New</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue={isPending ? "pending" : listing.status ?? "available"}>
                <option value="pending">Pending approval</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </label>
            <label>
              Make *
              <input name="make" defaultValue={listing.make ?? ""} required />
            </label>
            <label>
              Model *
              <input name="model" defaultValue={listing.model ?? ""} required />
            </label>
            <label>
              Variant
              <input name="variant" defaultValue={listing.variant ?? ""} />
            </label>
            <label>
              Year
              <input name="year" type="number" defaultValue={listing.year ?? ""} />
            </label>
            <label>
              Selling price
              <input name="price" type="number" defaultValue={listing.price ?? ""} />
            </label>
            <label>
              KM driven
              <input name="km" type="number" defaultValue={listing.km ?? ""} />
            </label>
            <label>
              Fuel
              <input name="fuel" defaultValue={listing.fuel ?? ""} />
            </label>
            <label>
              Transmission
              <input name="transmission" defaultValue={listing.transmission ?? ""} />
            </label>
            <label>
              Location
              <input name="location" defaultValue={listing.location ?? ""} />
            </label>
          </div>
          <label>
            Description
            <textarea
              name="description"
              rows={5}
              defaultValue={stripListingInternalMeta(listing.description)}
            />
          </label>
          <label>
            Photo URLs (one per line)
            <textarea name="photo_urls" rows={5} defaultValue={joinPhotos(listing.photo_urls)} />
          </label>
          <div className="dealer-form__actions">
            <button className="btn btn--solid" type="submit">
              Save changes
            </button>
            <Link className="btn btn--ghost" href="/admin/listings">
              Cancel
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
