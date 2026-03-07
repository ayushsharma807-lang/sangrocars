import Image from "next/image";
import Link from "next/link";
import { hasSupabaseConfig, supabaseServerOptional } from "@/lib/supabase";
import { dealerSlug } from "@/lib/dealerSlug";

type DealerRow = {
  id: string;
  name?: string | null;
  dealer_name?: string | null;
  company_name?: string | null;
  address?: string | null;
  location?: string | null;
  logo_url?: string | null;
  logo?: string | null;
};

type DealerCard = {
  id: string;
  name: string;
  address: string;
  logo: string | null;
  listings: number;
};

export default async function DealersPage() {
  if (!hasSupabaseConfig()) {
    return (
      <main className="home">
        <section className="section">
          <div className="section__header">
            <h2>Dealers unavailable</h2>
            <p>Supabase is not configured for this deployment.</p>
          </div>
          <Link className="btn btn--solid" href="/listings">
            Back to listings
          </Link>
        </section>
      </main>
    );
  }

  const sb = supabaseServerOptional();
  if (!sb) {
    return (
      <main className="home">
        <section className="section">
          <div className="section__header">
            <h2>Dealers unavailable</h2>
            <p>Supabase is not configured for this deployment.</p>
          </div>
          <Link className="btn btn--solid" href="/listings">
            Back to listings
          </Link>
        </section>
      </main>
    );
  }

  const { data: dealerRows } = await sb
    .from("dealers")
    .select("id, name, dealer_name, company_name, address, location, logo_url, logo")
    .limit(5000);

  const { data: listingRows } = await sb
    .from("listings")
    .select("dealer_id")
    .eq("status", "available")
    .not("dealer_id", "is", null);

  const counts = new Map<string, number>();
  for (const row of (listingRows ?? []) as { dealer_id?: string | null }[]) {
    const id = row.dealer_id;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const dealers: DealerCard[] = (dealerRows ?? []).map((row: DealerRow) => {
    const name =
      row.name || row.dealer_name || row.company_name || "Dealer profile";
    const address = row.address || row.location || "Address on request";
    return {
      id: row.id,
      name,
      address,
      logo: row.logo_url || row.logo || null,
      listings: counts.get(row.id) ?? 0,
    };
  });

  return (
    <main className="home">
      <section className="section">
        <div className="section__header section__header--split">
          <div>
            <h2>Trusted dealer partners</h2>
            <p>Browse verified dealers and their live inventory.</p>
          </div>
          <Link className="btn btn--outline" href="/listings">
            Browse listings
          </Link>
        </div>
        <div className="dealer-grid">
          {dealers.map((dealer) => (
            <article className="dealer-card" key={dealer.id}>
              <div className="dealer-card__header">
                {dealer.logo ? (
                  <div className="dealer-card__logo">
                    <Image
                      src={dealer.logo}
                      alt={`${dealer.name} logo`}
                      width={64}
                      height={64}
                    />
                  </div>
                ) : (
                  <div className="dealer-card__logo dealer-card__logo--fallback">
                    {dealer.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3>{dealer.name}</h3>
                  <p>{dealer.address}</p>
                </div>
              </div>
              <div className="dealer-card__meta">
                <span className="chip">{dealer.listings} cars listed</span>
                <span className="chip">Verified dealer</span>
                <span className="chip">Finance available</span>
                <span className="chip">Insurance support</span>
              </div>
              <div className="dealer-card__actions">
                <Link
                  className="btn btn--solid btn--tight"
                  href={`/dealers/${dealerSlug(dealer.name, dealer.id)}`}
                >
                  View dealer profile
                </Link>
                <Link className="btn btn--ghost btn--tight" href={`/dealer/${dealer.id}`}>
                  View dealer stock
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
