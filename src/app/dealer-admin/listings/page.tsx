import { redirect } from "next/navigation";
import Link from "next/link";
import DealerNav from "../DealerNav";
import { extractDealerCode } from "@/lib/dealerCode";
import { requireDealer } from "@/lib/dealerAuth";
import { supabaseServer } from "@/lib/supabase";
import SyncButton from "./SyncButton";
import { isListingPendingApproval } from "@/lib/listingApproval";

export default async function DealerListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string; skipped?: string; failed?: string }>;
}) {
  const params = await searchParams;
  const auth = await requireDealer();
  if (!auth.ok) {
    const error = auth.error === "dealer_not_found" ? "dealer_not_found" : "unauthorized";
    redirect(`/dealer-admin/login?error=${error}`);
  }

  const sb = supabaseServer();
  const { data: listings } = await sb
    .from("listings")
    .select(
      "id, make, model, variant, year, price, status, description, created_at"
    )
    .eq("dealer_id", auth.dealer.id)
    .order("created_at", { ascending: false });

  const imported = Number(params.imported ?? 0);
  const skipped = Number(params.skipped ?? 0);
  const failed = Number(params.failed ?? 0);
  const hasImportMessage =
    Number.isFinite(imported) || Number.isFinite(skipped) || Number.isFinite(failed);

  return (
    <main className="home dealer-admin">
      <DealerNav dealerId={auth.dealer.id} dealerName={auth.dealer.name} dealerCode={extractDealerCode(auth.dealer.description)} />
      <section className="section">
        <div className="section__header">
          <div>
            <h2>Your listings</h2>
            <p>Manage all cars in your inventory.</p>
          </div>
          <div className="dealer__actions">
            <SyncButton
              dealerId={auth.dealer.id}
              hasFeed={Boolean(
                auth.dealer.feed_url ||
                  auth.dealer.inventory_url ||
                  auth.dealer.sitemap_url
              )}
            />
            <Link className="btn btn--outline" href="/dealer-admin/bulk-upload">
              Bulk upload from phone
            </Link>
            <Link className="btn btn--outline" href="/dealer-admin/whatsapp">
              WhatsApp post
            </Link>
            <Link className="btn btn--solid" href="/dealer-admin/listings/new">
              Add listing
            </Link>
          </div>
        </div>
        {hasImportMessage && (imported || skipped || failed) ? (
          <div className="simple-alert">
            Imported {imported} listings. Skipped {skipped}. Failed {failed}.
          </div>
        ) : null}
        <div className="dealer-panel dealer-panel--import">
          <h3>Bulk upload listings (CSV + ZIP photos)</h3>
          <p>
            Upload a CSV with columns like make, model, variant, year, price, km,
            fuel, transmission, location, status, type, description, photo_urls,
            image_key.
          </p>
          <p>
            For phone photos, upload an optional ZIP file and put the same
            <code> image_key </code>
            in the CSV. Example: CSV row has <code>HONDA-CITY-01</code> and ZIP
            has <code>HONDA-CITY-01-1.jpg</code>, <code>HONDA-CITY-01-2.jpg</code>.
          </p>
          <p>
            <Link className="link" href="/templates/dealer-bulk-import-template.csv">
              Download full CSV template
            </Link>
            {" · "}
            <Link className="link" href="/templates/dealer-bulk-import-simple-template.csv">
              Download simple CSV template
            </Link>
          </p>
          <form
            className="dealer-form dealer-form--inline"
            method="post"
            action="/api/dealer/listings/import"
            encType="multipart/form-data"
          >
            <input type="hidden" name="return" value="/dealer-admin/listings" />
            <label>
              CSV file
              <input name="file" type="file" accept=".csv,text/csv" required />
            </label>
            <label>
              Photos ZIP (optional)
              <input name="images_zip" type="file" accept=".zip,application/zip" />
            </label>
            <label>
              Default status
              <select name="status" defaultValue="available">
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </label>
            <label>
              Default type
              <select name="type" defaultValue="used">
                <option value="used">Used</option>
                <option value="new">New</option>
              </select>
            </label>
            <button className="btn btn--solid" type="submit">
              Import CSV
            </button>
          </form>
        </div>
        <div className="table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                <th>Listing</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created</th>
                <th>Edit</th>
              </tr>
            </thead>
            <tbody>
              {!listings?.length ? (
                <tr>
                  <td colSpan={5} className="empty">
                    No listings yet. Add your first car.
                  </td>
                </tr>
              ) : (
                listings.map((listing) => {
                  const title = [
                    listing.year,
                    listing.make,
                    listing.model,
                    listing.variant,
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <tr key={listing.id}>
                      <td>{title || "Listing"}</td>
                      <td>{listing.price ? `₹${listing.price}` : "—"}</td>
                      <td>
                        <span className="status-badge">
                          {isListingPendingApproval(listing) ? "pending approval" : listing.status ?? "available"}
                        </span>
                      </td>
                      <td>
                        {listing.created_at
                          ? new Date(listing.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <Link
                          className="link"
                          href={`/dealer-admin/listings/${listing.id}`}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
