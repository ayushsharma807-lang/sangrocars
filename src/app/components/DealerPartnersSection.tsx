import Image from "next/image";
import Link from "next/link";
import { hasSupabaseConfig, supabaseServerOptional } from "@/lib/supabase";
import { dealerSlug } from "@/lib/dealerSlug";

type DealerRow = {
  id: string;
  name?: string | null;
  dealer_name?: string | null;
  company_name?: string | null;
  location?: string | null;
  address?: string | null;
  logo_url?: string | null;
  logo?: string | null;
};

type DealerCard = {
  id: string;
  name: string;
  location: string;
  logo: string | null;
  listings: number;
};

export default async function DealerPartnersSection() {
  if (!hasSupabaseConfig()) return null;
  const sb = supabaseServerOptional();
  if (!sb) return null;

  const { data: dealerRows } = await sb
    .from("dealers")
    .select("id, name, dealer_name, company_name, location, address, logo_url, logo")
    .limit(8);

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
      row.name || row.dealer_name || row.company_name || "Dealer";
    const location = row.location || row.address || "India";
    return {
      id: row.id,
      name,
      location,
      logo: row.logo_url || row.logo || null,
      listings: counts.get(row.id) ?? 0,
    };
  });

  if (dealers.length === 0) return null;

  return (
    <section className="section dealer-partners">
      <div className="section__header section__header--split">
        <div>
          <h2>Trusted dealer partners</h2>
          <p>Verified dealers with finance and insurance support.</p>
        </div>
        <Link className="btn btn--outline" href="/dealers">
          Browse dealers
        </Link>
      </div>
      <div className="dealer-partners__grid">
        {dealers.map((dealer) => (
          <article className="dealer-partners__card" key={dealer.id}>
            <div className="dealer-partners__head">
              {dealer.logo ? (
                <div className="dealer-partners__logo">
                  <Image
                    src={dealer.logo}
                    alt={`${dealer.name} logo`}
                    width={56}
                    height={56}
                  />
                </div>
              ) : (
                <div className="dealer-partners__logo dealer-partners__logo--fallback">
                  {dealer.name.charAt(0)}
                </div>
              )}
              <div>
                <h3>{dealer.name}</h3>
                <p>{dealer.location}</p>
              </div>
            </div>
            <div className="dealer-partners__meta">
              <span className="chip">{dealer.listings} cars</span>
              <span className="chip">Verified</span>
              <span className="chip">Finance</span>
              <span className="chip">Insurance</span>
            </div>
            <Link
              className="btn btn--ghost btn--tight"
              href={`/dealers/${dealerSlug(dealer.name, dealer.id)}`}
            >
              View profile
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
