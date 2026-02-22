import { redirect } from "next/navigation";
import DealerNav from "../../DealerNav";
import ListingForm from "../ListingForm";
import { requireDealer } from "@/lib/dealerAuth";
import { supabaseServer } from "@/lib/supabase";
import { parseListingExperienceDescription } from "@/lib/listingExperience";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireDealer();
  if (!auth.ok) {
    const error = auth.error === "dealer_not_found" ? "dealer_not_found" : "unauthorized";
    redirect(`/dealer-admin/login?error=${error}`);
  }

  const sb = supabaseServer();
  const { data: listing, error } = await sb
    .from("listings")
    .select(
      "id, type, make, model, variant, year, km, fuel, transmission, price, location, description, status, photo_urls"
    )
    .eq("id", id)
    .eq("dealer_id", auth.dealer.id)
    .single();

  if (error || !listing) {
    redirect("/dealer-admin/listings");
  }

  const experience = parseListingExperienceDescription(listing.description);
  const listingForForm = {
    ...listing,
    description: experience.cleanDescription,
    tour_360_url: experience.meta.tour360Url,
    walkthrough_video_url: experience.meta.walkthroughVideoUrl,
    interior_vr_url: experience.meta.interiorVrUrl,
    ar_model_url: experience.meta.arModelUrl,
    ar_ios_model_url: experience.meta.arIosModelUrl,
  };

  return (
    <main className="home dealer-admin">
      <DealerNav dealerId={auth.dealer.id} dealerName={auth.dealer.name} />
      <section className="section">
        <div className="section__header">
          <div>
            <h2>Edit listing</h2>
            <p>Update your car details.</p>
          </div>
        </div>
        <ListingForm
          listing={listingForForm}
          action={`/api/dealer/listings/${id}`}
          submitLabel="Save changes"
        />
        <form
          className="dealer-delete"
          method="post"
          action={`/api/dealer/listings/${id}/delete`}
        >
          <button className="btn btn--ghost" type="submit">
            Delete listing
          </button>
        </form>
      </section>
    </main>
  );
}
