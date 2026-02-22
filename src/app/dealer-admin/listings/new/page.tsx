import { redirect } from "next/navigation";
import DealerNav from "../../DealerNav";
import ListingWizard from "../ListingWizard";
import { requireDealer } from "@/lib/dealerAuth";

export default async function NewListingPage() {
  const auth = await requireDealer();
  if (!auth.ok) {
    const error = auth.error === "dealer_not_found" ? "dealer_not_found" : "unauthorized";
    redirect(`/dealer-admin/login?error=${error}`);
  }

  return (
    <main className="home dealer-admin">
      <DealerNav dealerId={auth.dealer.id} dealerName={auth.dealer.name} />
      <section className="section">
        <div className="section__header">
          <div>
            <h2>Post a car</h2>
            <p>3 simple steps for dealers.</p>
          </div>
        </div>
        <ListingWizard action="/api/dealer/listings" submitLabel="Create listing" />
      </section>
    </main>
  );
}
