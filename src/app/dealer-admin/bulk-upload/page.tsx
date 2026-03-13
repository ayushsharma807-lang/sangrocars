import { redirect } from "next/navigation";
import DealerNav from "../DealerNav";
import { extractDealerCode } from "@/lib/dealerCode";
import MobileBulkUploader from "./MobileBulkUploader";
import { requireDealer } from "@/lib/dealerAuth";

export default async function DealerBulkUploadPage() {
  const auth = await requireDealer();
  if (!auth.ok) {
    const error = auth.error === "dealer_not_found" ? "dealer_not_found" : "unauthorized";
    redirect(`/dealer-admin/login?error=${error}`);
  }

  return (
    <main className="home dealer-admin">
      <DealerNav dealerId={auth.dealer.id} dealerName={auth.dealer.name} dealerCode={extractDealerCode(auth.dealer.description)} />
      <section className="section">
        <div className="section__header">
          <div>
            <h2>Bulk upload from phone</h2>
            <p>Add many cars quickly with photos from your gallery or camera.</p>
          </div>
        </div>
        <MobileBulkUploader />
      </section>
    </main>
  );
}
