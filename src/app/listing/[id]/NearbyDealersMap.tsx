import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";
import { cityFromText, distanceKm } from "@/lib/geo";

type Props = {
  listingDealerId: string | null;
  listingLocation: string | null;
};

type DealerRow = {
  id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
};

export default async function NearbyDealersMap({
  listingDealerId,
  listingLocation,
}: Props) {
  const center = cityFromText(listingLocation);
  if (!center) {
    return (
      <div className="nearby-card">
        <h3>Nearby dealers map</h3>
        <p>City map is available when listing has a recognizable city.</p>
      </div>
    );
  }

  const sb = supabaseServer();
  const [{ data: dealersData }, { data: listingsData }] = await Promise.all([
    sb.from("dealers").select("id, name, address, phone, whatsapp").limit(3000),
    sb.from("listings").select("dealer_id").eq("status", "available").limit(10000),
  ]);

  const countMap = new Map<string, number>();
  for (const row of listingsData ?? []) {
    const dealerId = String(row.dealer_id ?? "");
    if (!dealerId) continue;
    countMap.set(dealerId, (countMap.get(dealerId) ?? 0) + 1);
  }

  const nearby = ((dealersData ?? []) as DealerRow[])
    .filter((dealer) => dealer.id !== listingDealerId)
    .map((dealer) => {
      const dealerCity = cityFromText(dealer.address);
      if (!dealerCity) return null;
      const distance = distanceKm(center, dealerCity);
      return {
        ...dealer,
        distance,
        city: dealerCity.city,
        liveCount: countMap.get(dealer.id) ?? 0,
      };
    })
    .filter(
      (
        item
      ): item is DealerRow & { distance: number; city: string; liveCount: number } =>
        Boolean(item)
    )
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6);

  const bbox = [
    center.lng - 0.45,
    center.lat - 0.25,
    center.lng + 0.45,
    center.lat + 0.25,
  ]
    .map((value) => value.toFixed(5))
    .join("%2C");
  const marker = `${center.lat.toFixed(5)}%2C${center.lng.toFixed(5)}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
  const mapsSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(center.city)}`;

  return (
    <div className="nearby-card">
      <div className="nearby-card__header">
        <h3>Nearby dealers map</h3>
        <p>{center.city}</p>
      </div>
      <div className="nearby-card__map">
        <iframe
          title={`Nearby map of ${center.city}`}
          src={mapSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="nearby-card__actions">
        <a className="simple-link-btn" href={mapsSearch} target="_blank" rel="noreferrer">
          Open in maps
        </a>
      </div>

      {nearby.length > 0 ? (
        <ul className="nearby-card__list">
          {nearby.map((dealer) => (
            <li key={dealer.id}>
              <div>
                <strong>{dealer.name ?? "Dealer"}</strong>
                <p>
                  {dealer.city} • {Math.round(dealer.distance)} km • {dealer.liveCount} cars
                </p>
              </div>
              <Link className="simple-link-btn" href={`/dealer/${dealer.id}`}>
                View
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dealer-form__hint">No nearby dealers found yet in this city cluster.</p>
      )}
    </div>
  );
}
