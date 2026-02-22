import { redirect } from "next/navigation";
import Link from "next/link";
import DealerNav from "../DealerNav";
import { requireDealer } from "@/lib/dealerAuth";
import { supabaseServer } from "@/lib/supabase";
import SyncButton from "./SyncButton";

export default async function DealerListingsPage() {
  const auth = await requireDealer();
  if (!auth.ok) {
    const error = auth.error === "dealer_not_found" ? "dealer_not_found" : "unauthorized";
    redirect(`/dealer-admin/login?error=${error}`);
  }

  const sb = supabaseServer();
  const { data: listings } = await sb
    .from("listings")
    .select(
      "id, make, model, variant, year, price, status, created_at"
    )
    .eq("dealer_id", auth.dealer.id)
    .order("created_at", { ascending: false });

  return (
    <main className="home dealer-admin">
      <DealerNav dealerId={auth.dealer.id} dealerName={auth.dealer.name} />
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
            <Link className="btn btn--outline" href="/dealer-admin/whatsapp">
              WhatsApp post
            </Link>
            <Link className="btn btn--solid" href="/dealer-admin/listings/new">
              Add listing
            </Link>
          </div>
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
                          {listing.status ?? "available"}
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
