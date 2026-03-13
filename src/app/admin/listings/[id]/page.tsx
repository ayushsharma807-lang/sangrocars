import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import {
  isListingPendingApproval,
  stripListingInternalMeta,
} from "@/lib/listingApproval";
import AdminEditListingForm from "./AdminEditListingForm";

type DealerOption = {
  id: string;
  name: string | null;
};

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

        <AdminEditListingForm
          listing={listing}
          dealers={dealerOptions}
          isPending={isPending}
          cleanedDescription={stripListingInternalMeta(listing.description)}
        />
      </section>
    </main>
  );
}
