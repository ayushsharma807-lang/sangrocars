import { redirect } from "next/navigation";
import DealerNav from "../DealerNav";
import { requireDealer } from "@/lib/dealerAuth";
import { supabaseServer } from "@/lib/supabase";
import DealerLeadsTable from "./DealerLeadsTable";

const isMissingSchema = (message?: string | null) => {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return (
    lowered.includes("does not exist") ||
    lowered.includes("column") ||
    lowered.includes("could not find the table") ||
    lowered.includes("schema cache") ||
    lowered.includes("relation")
  );
};

export default async function DealerLeadsPage() {
  const auth = await requireDealer();
  if (!auth.ok) {
    const error = auth.error === "dealer_not_found" ? "dealer_not_found" : "unauthorized";
    redirect(`/dealer-admin/login?error=${error}`);
  }

  const sb = supabaseServer();
  type Lead = {
    id: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    listing_title?: string | null;
    status?: string | null;
    created_at?: string | null;
    message?: string | null;
    notes?: string | null;
  };
  let leads: Lead[] = [];

  const byDealer = await sb
    .from("leads")
    .select("*")
    .eq("dealer_id", auth.dealer.id)
    .order("created_at", { ascending: false });

  if (!byDealer.error) {
    leads = (byDealer.data ?? []) as Lead[];
  } else if (isMissingSchema(byDealer.error.message)) {
    const listings = await sb
      .from("listings")
      .select("id")
      .eq("dealer_id", auth.dealer.id);
    if (!listings.error && listings.data?.length) {
      const ids = listings.data.map((row) => row.id);
      const byListing = await sb
        .from("leads")
        .select("*")
        .in("listing_id", ids)
        .order("created_at", { ascending: false });
      leads = (byListing.data ?? []) as Lead[];
    }
  }

  return (
    <main className="home dealer-admin">
      <DealerNav dealerId={auth.dealer.id} dealerName={auth.dealer.name} />
      <DealerLeadsTable leads={leads} />
    </main>
  );
}
