import Link from "next/link";
import SocialEmbed from "@/app/components/SocialEmbed";
import { supabaseServer } from "@/lib/supabase";

type ExclusiveDeal = {
  id: string;
  title: string;
  dealer: string;
  city?: string | null;
  price?: string | null;
  videoUrl?: string | null;
  embedCode?: string | null;
  tags: string[];
  highlights: string[];
};

type DealRow = Record<string, unknown>;

const fallbackDeals: ExclusiveDeal[] = [
  {
    id: "deal-1",
    title: "2021 Hyundai Creta SX (Petrol)",
    dealer: "Jalandhar Cars",
    city: "Jalandhar, Punjab",
    price: "₹12.9L",
    videoUrl: "/videos/hero-parking.mp4",
    tags: ["Single owner", "Certified", "Limited time"],
    highlights: ["Full service history", "Fresh detailing", "0% down offer"],
  },
  {
    id: "deal-2",
    title: "2022 Kia Seltos HTX (Diesel)",
    dealer: "Elite Auto Gallery",
    city: "Ludhiana, Punjab",
    price: "₹14.5L",
    videoUrl: "/videos/hero-parking.mp4",
    tags: ["Low kms", "Executive car", "Video verified"],
    highlights: ["Warranty included", "New tyres", "Exchange bonus"],
  },
  {
    id: "deal-3",
    title: "2020 Toyota Innova Crysta GX",
    dealer: "Prime Wheels",
    city: "Chandigarh",
    price: "₹18.4L",
    videoUrl: "/videos/hero-parking.mp4",
    tags: ["Family favorite", "Top condition", "Hot deal"],
    highlights: ["7-seater comfort", "Verified documents", "Instant delivery"],
  },
];

const normalizeVideoUrl = (value?: string | null) => {
  if (!value) return null;
  const url = value.trim();
  if (!url) return null;
  if (url.includes("/embed/")) return url;
  if (url.includes("youtube.com/watch")) {
    try {
      const parsed = new URL(url);
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    } catch {
      return url;
    }
  }
  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1]?.split("?")[0];
    if (id) return `https://www.youtube.com/embed/${id}`;
  }
  return url;
};

const toList = (value: unknown) => {
  if (!value) return [] as string[];
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [] as string[];
};

const mapDeal = (row: DealRow): ExclusiveDeal => ({
  id: String(row.id ?? ""),
  title: String(row.title ?? ""),
  dealer: String(row.dealer ?? ""),
  city: row.city ? String(row.city) : null,
  price: row.price ? String(row.price) : null,
  videoUrl: normalizeVideoUrl(
    (row.video_url as string | undefined) || (row.video as string | undefined)
  ),
  embedCode: row.embed_code ? String(row.embed_code) : null,
  tags: toList(row.tags),
  highlights: toList(row.highlights),
});

const getDeal = async (id: string) => {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("exclusive_deals")
    .select("*")
    .eq("id", id)
    .single();

  if (!error && data) return mapDeal(data as DealRow);
  return fallbackDeals.find((deal) => deal.id === id) ?? null;
};

const buildSimilarLink = (deal: ExclusiveDeal) => {
  const query = [deal.title, deal.city ?? ""]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  return `/listings${params.toString() ? `?${params.toString()}` : ""}`;
};

export default async function ExclusiveDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await getDeal(id);

  if (!deal) {
    return (
      <main className="simple-page exclusive-deal-page">
        <section className="simple-shell">
          <div className="simple-header">
            <div>
              <h1>Deal not found</h1>
              <p>This exclusive deal is not available right now.</p>
            </div>
            <div className="simple-detail__top-actions">
              <Link className="simple-link" href="/#exclusive-deals">
                Back to exclusive deals
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="simple-page exclusive-deal-page">
      <section className="simple-shell">
        <div className="simple-header">
          <div>
            <h1>{deal.title}</h1>
            <p>
              {deal.dealer}
              {deal.city ? ` • ${deal.city}` : ""}
            </p>
          </div>
          <div className="simple-detail__top-actions">
            <Link className="simple-link" href="/#exclusive-deals">
              Back to exclusive deals
            </Link>
            <Link className="simple-link" href={buildSimilarLink(deal)}>
              See similar cars
            </Link>
          </div>
        </div>

        <div className="exclusive-deal-detail">
          <section className="simple-results">
            <div className="video-frame exclusive-deal-detail__frame">
              {deal.embedCode ? (
                <SocialEmbed embedCode={deal.embedCode} />
              ) : deal.videoUrl ? (
                deal.videoUrl.endsWith(".mp4") ? (
                  <video controls src={deal.videoUrl} />
                ) : (
                  <iframe
                    src={deal.videoUrl}
                    title={deal.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )
              ) : (
                <div className="video-frame__placeholder">Video coming soon</div>
              )}
            </div>
          </section>

          <aside className="simple-results exclusive-deal-detail__info">
            <h2>Deal summary</h2>
            {deal.price ? <p className="exclusive-deal-detail__price">{deal.price}</p> : null}
            {deal.tags.length > 0 ? (
              <div className="deal-tags">
                {deal.tags.map((tag) => (
                  <span className="chip" key={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
            {deal.highlights.length > 0 ? (
              <ul className="deal-highlights">
                {deal.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>More details will be shared by dealer on contact.</p>
            )}
            <div className="exclusive-deal-detail__actions">
              <Link className="simple-button" href={buildSimilarLink(deal)}>
                Open matching listings
              </Link>
              <Link className="simple-button simple-button--secondary" href="/sell">
                Post your car
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

