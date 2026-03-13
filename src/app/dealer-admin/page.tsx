import { redirect } from "next/navigation";
import Link from "next/link";
import DealerNav from "./DealerNav";
import { extractDealerCode } from "@/lib/dealerCode";
import { requireDealer } from "@/lib/dealerAuth";
import { supabaseServer } from "@/lib/supabase";

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

const getLeadCount = async (dealerId: string) => {
  const sb = supabaseServer();
  const byDealer = await sb
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("dealer_id", dealerId);

  if (!byDealer.error) {
    return byDealer.count ?? 0;
  }

  if (!isMissingSchema(byDealer.error.message)) {
    return 0;
  }

  const listings = await sb
    .from("listings")
    .select("id")
    .eq("dealer_id", dealerId);
  if (listings.error || !listings.data?.length) {
    return 0;
  }

  const ids = listings.data.map((row) => row.id);
  const byListing = await sb
    .from("leads")
    .select("id", { count: "exact", head: true })
    .in("listing_id", ids);
  return byListing.count ?? 0;
};

const getRecentLeads = async (dealerId: string) => {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("leads")
    .select("id, name, phone, listing_title, status, created_at")
    .eq("dealer_id", dealerId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!error) return data ?? [];
  if (!isMissingSchema(error.message)) return [];
  return [];
};

export default async function DealerDashboard() {
  const auth = await requireDealer();
  if (!auth.ok) {
    const error = auth.error === "dealer_not_found" ? "dealer_not_found" : "unauthorized";
    redirect(`/dealer-admin/login?error=${error}`);
  }

  const dealer = auth.dealer;
  const sb = supabaseServer();
  const listings = await sb
    .from("listings")
    .select("id, make, model, year, price, status, created_at")
    .eq("dealer_id", dealer.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const [leadCount, recentLeads] = await Promise.all([
    getLeadCount(dealer.id),
    getRecentLeads(dealer.id),
  ]);

  const onboardingSteps = [
    {
      label: "Complete profile details",
      done: Boolean(dealer.name && (dealer.phone || dealer.whatsapp) && dealer.address),
      href: "/dealer-admin/profile",
    },
    {
      label: "Add your first listing",
      done: Boolean(listings.data?.length),
      href: "/dealer-admin/listings/new",
    },
    {
      label: "Connect inventory feed (optional)",
      done: Boolean(dealer.inventory_url || dealer.sitemap_url || dealer.feed_url),
      href: "/dealer-admin/profile",
    },
  ];

  const completedSteps = onboardingSteps.filter((item) => item.done).length;

  return (
    <main className="home dealer-admin">
      <DealerNav dealerId={dealer.id} dealerName={dealer.name} dealerCode={extractDealerCode(dealer.description)} />
      <section className="section">
        <div className="section__header">
          <div>
            <h2>Welcome back{dealer.name ? `, ${dealer.name}` : ""}</h2>
            <p>Manage your inventory and incoming leads.</p>
          </div>
          <div className="dealer__actions">
            <Link className="btn btn--solid" href="/dealer-admin/listings/new">
              Add listing
            </Link>
          </div>
        </div>
        <div className="dealer-stats">
          <div className="notification-card">
            <h3>Active listings</h3>
            <p className="notification-value">
              {listings.data?.length ?? 0}
            </p>
          </div>
          <div className="notification-card">
            <h3>Leads</h3>
            <p className="notification-value">{leadCount}</p>
          </div>
        </div>
        {completedSteps < onboardingSteps.length && (
          <div className="dealer-panel dealer-panel--onboarding">
            <h3>Dealer onboarding</h3>
            <p>Complete these steps to unlock more leads.</p>
            <ul className="dealer-checklist">
              {onboardingSteps.map((item) => (
                <li key={item.label} className={item.done ? "is-done" : ""}>
                  <span>{item.label}</span>
                  <Link className="link" href={item.href}>
                    {item.done ? "Update" : "Start"}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="dealer-checklist__progress">
              {completedSteps}/{onboardingSteps.length} steps completed
            </p>
          </div>
        )}
        <div className="dealer-panel">
          <h3>Recent listings</h3>
          {!listings.data?.length ? (
            <p className="notification-empty">No listings yet.</p>
          ) : (
            <ul className="dealer-list">
              {listings.data.map((listing) => (
                <li key={listing.id}>
                  <span>
                    {listing.year ?? ""} {listing.make ?? ""} {listing.model ?? ""}
                  </span>
                  <span>{listing.status ?? "available"}</span>
                  <a
                    className="link"
                    href={`/dealer-admin/listings/${listing.id}`}
                  >
                    Edit
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="dealer-panel">
          <div className="dealer-panel__header">
            <h3>Recent leads</h3>
            <Link className="link" href="/dealer-admin/leads">
              View all
            </Link>
          </div>
          {!recentLeads?.length ? (
            <p className="notification-empty">No leads yet.</p>
          ) : (
            <ul className="dealer-list">
              {recentLeads.map((lead) => (
                <li key={lead.id}>
                  <span>
                    {lead.name ?? "Lead"} {lead.listing_title ? `• ${lead.listing_title}` : ""}
                  </span>
                  <span>{lead.status ?? "new"}</span>
                  <a className="link" href={`/dealer-admin/leads/${lead.id}`}>
                    View
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
