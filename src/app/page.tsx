import Link from "next/link";
import { supabaseServer } from "@/lib/supabase";
import SocialEmbed from "@/app/components/SocialEmbed";

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
type ListingMakeRow = {
  make?: string | null;
};
type PopularBrand = {
  key: string;
  name: string;
  query: string;
  logo: string;
  aliases: string[];
};
type BrandStat = PopularBrand & {
  count: number;
};

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

const weeklySteps = [
  {
    title: "We shoot the car",
    description: "Short, clear video so buyers trust what they see.",
  },
  {
    title: "We publish the deal",
    description: "Your video goes live on the front page for one week.",
  },
  {
    title: "Leads come to you",
    description: "Buyers contact you directly from your listing.",
  },
];

const retailExperienceLinks = [
  {
    title: "AR / VR Test Drives",
    description:
      "Let buyers place 3D cars at home, run immersive tours, and inspect remotely.",
    href: "/experience",
  },
  {
    title: "AI Shopping Guide",
    description:
      "Concierge answers buyer questions and recommends listings using live inventory.",
    href: "/ai-guide",
  },
  {
    title: "My Garage Dashboard",
    description:
      "Save cars/configs, track values, and set reminders for service and renewals.",
    href: "/garage",
  },
  {
    title: "Unified Dealmaking",
    description:
      "Start finance + trade-in online and continue in showroom with one reference code.",
    href: "/deal-builder",
  },
  {
    title: "Live Stream Events",
    description:
      "Host weekly live walkthroughs with Q&A and live-only offers for urgent buyers.",
    href: "/live",
  },
  {
    title: "Remote Docs",
    description:
      "Collect paperwork remotely so customers only visit showroom for final delivery.",
    href: "/remote-docs",
  },
  {
    title: "Trust Stories",
    description:
      "Cinematic content, staff spotlights, and real buyer testimonials build trust.",
    href: "/stories",
  },
  {
    title: "How-To Hub",
    description:
      "Educational ownership and maintenance guides to build long-term authority.",
    href: "/learn",
  },
];

const premiumSignals = [
  {
    label: "Concierge-ready",
    value: "On-ground team verifies each feature car before publishing.",
  },
  {
    label: "Premium only",
    value: "Weekly slots are reserved for standout inventory and rare specs.",
  },
  {
    label: "Direct & fast",
    value: "Buyers connect to the dealer without any middle step.",
  },
];

const spotlightChecklist = [
  "Fresh walkaround videos",
  "High-value inventory focus",
  "Fast dealer response path",
];

const popularBrands: PopularBrand[] = [
  {
    key: "maruti-suzuki",
    name: "Maruti Suzuki",
    query: "Maruti Suzuki",
    logo: "https://cdn.simpleicons.org/suzuki/C9A55F",
    aliases: ["maruti suzuki", "maruti", "suzuki"],
  },
  {
    key: "hyundai",
    name: "Hyundai",
    query: "Hyundai",
    logo: "https://cdn.simpleicons.org/hyundai/C9A55F",
    aliases: ["hyundai"],
  },
  {
    key: "tata",
    name: "Tata",
    query: "Tata",
    logo: "https://cdn.simpleicons.org/tata/C9A55F",
    aliases: ["tata"],
  },
  {
    key: "mahindra",
    name: "Mahindra",
    query: "Mahindra",
    logo: "https://cdn.simpleicons.org/mahindra/C9A55F",
    aliases: ["mahindra"],
  },
  {
    key: "toyota",
    name: "Toyota",
    query: "Toyota",
    logo: "https://cdn.simpleicons.org/toyota/C9A55F",
    aliases: ["toyota"],
  },
  {
    key: "kia",
    name: "Kia",
    query: "Kia",
    logo: "https://cdn.simpleicons.org/kia/C9A55F",
    aliases: ["kia"],
  },
  {
    key: "honda",
    name: "Honda",
    query: "Honda",
    logo: "https://cdn.simpleicons.org/honda/C9A55F",
    aliases: ["honda"],
  },
  {
    key: "mg",
    name: "MG",
    query: "MG",
    logo: "https://cdn.simpleicons.org/mg/C9A55F",
    aliases: ["mg", "morris garages"],
  },
  {
    key: "skoda",
    name: "Skoda",
    query: "Skoda",
    logo: "https://cdn.simpleicons.org/skoda/C9A55F",
    aliases: ["skoda"],
  },
  {
    key: "volkswagen",
    name: "Volkswagen",
    query: "Volkswagen",
    logo: "https://cdn.simpleicons.org/volkswagen/C9A55F",
    aliases: ["volkswagen", "vw"],
  },
  {
    key: "renault",
    name: "Renault",
    query: "Renault",
    logo: "https://cdn.simpleicons.org/renault/C9A55F",
    aliases: ["renault"],
  },
  {
    key: "nissan",
    name: "Nissan",
    query: "Nissan",
    logo: "https://cdn.simpleicons.org/nissan/C9A55F",
    aliases: ["nissan"],
  },
];

const isMissingSchema = (message?: string | null) => {
  if (!message) return false;
  const lowered = message.toLowerCase();
  return (
    lowered.includes("does not exist") ||
    lowered.includes("relation") ||
    lowered.includes("column") ||
    lowered.includes("could not find the table") ||
    lowered.includes("schema cache")
  );
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
    const parts = url.split("youtu.be/");
    const id = parts[1]?.split("?")[0];
    if (id) return `https://www.youtube.com/embed/${id}`;
  }
  return url;
};

const mapDeal = (row: DealRow): ExclusiveDeal => {
  return {
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
  };
};

const getExclusiveDeals = async () => {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("exclusive_deals")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return {
      deals: fallbackDeals,
      usedFallback: isMissingSchema(error.message),
      error: error.message,
    };
  }

  return {
    deals: (data ?? []).map(mapDeal),
    usedFallback: false,
    error: null,
  };
};

const makeMatchesBrand = (make: string, aliases: string[]) => {
  const normalized = make.toLowerCase().replace(/\s+/g, " ").trim();
  return aliases.some((alias) => {
    const target = alias.toLowerCase();
    return (
      normalized === target ||
      normalized.startsWith(`${target} `) ||
      normalized.endsWith(` ${target}`) ||
      normalized.includes(` ${target} `)
    );
  });
};

const getBrandStats = async (): Promise<BrandStat[]> => {
  const sb = supabaseServer();
  const counts = new Map(popularBrands.map((brand) => [brand.key, 0]));
  const pageSize = 1000;
  const maxPages = 20;

  for (let page = 0; page < maxPages; page += 1) {
    const from = page * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await sb
      .from("listings")
      .select("make")
      .eq("status", "available")
      .range(from, to);

    if (error) {
      return popularBrands.map((brand) => ({ ...brand, count: 0 }));
    }

    const rows = (data ?? []) as ListingMakeRow[];
    for (const row of rows) {
      const make = row.make?.trim();
      if (!make) continue;

      const brand = popularBrands.find((item) =>
        makeMatchesBrand(make, item.aliases)
      );
      if (!brand) continue;
      counts.set(brand.key, (counts.get(brand.key) ?? 0) + 1);
    }

    if (rows.length < pageSize) break;
  }

  return popularBrands.map((brand) => ({
    ...brand,
    count: counts.get(brand.key) ?? 0,
  }));
};

export default async function Home() {
  const [{ deals }, brandStats] = await Promise.all([
    getExclusiveDeals(),
    getBrandStats(),
  ]);

  return (
    <main className="home exclusive">
      <section className="exclusive-hero">
        <div className="exclusive-hero__media" aria-hidden="true">
          <video
            className="exclusive-hero__video"
            autoPlay
            playsInline
            muted
            loop
            poster="/images/hero-parking.jpg"
          >
            <source src="/videos/hero-parking.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="exclusive-hero__content">
          <div>
            <p className="exclusive-hero__eyebrow">Exclusive deals of the week</p>
            <h1>
              Luxury picks for buyers who want the <span className="accent">best cars first</span>
            </h1>
            <p>
              A premium front page for premium inventory. Every week we shoot
              new videos, curate standout deals, and publish only the cars worth
              a serious buyer&apos;s time.
            </p>
            <div className="exclusive-hero__actions">
              <Link className="btn btn--solid" href="#exclusive-deals">
                Watch weekly drops
              </Link>
              <Link className="btn btn--outline" href="/listings">
                Browse all cars
              </Link>
              <Link className="btn btn--glass" href="/sell">
                Post your car
              </Link>
            </div>
            <div className="exclusive-hero__stats">
              <div>
                <strong>7 days</strong>
                <span>Each feature stays live</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Video-verified deals</span>
              </div>
              <div>
                <strong>Direct</strong>
                <span>Buyer-to-dealer contact</span>
              </div>
            </div>
          </div>

          <aside className="exclusive-hero__spotlight">
            <p className="exclusive-hero__spotlight-eyebrow">Collector&apos;s spotlight</p>
            <h2>Curated inventory. Weekly release.</h2>
            <ul>
              {spotlightChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link className="btn btn--glass btn--full" href="/dealer-admin/login">
              Feature with us
            </Link>
          </aside>
        </div>
      </section>

      <section className="section exclusive-signals">
        <div className="exclusive-signals__grid">
          {premiumSignals.map((item) => (
            <article className="exclusive-signals__item" key={item.label}>
              <p>{item.label}</p>
              <h3>{item.value}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="exclusive-deals">
        <div className="section__header section__header--split">
          <div>
            <h2>Exclusive deals this week</h2>
            <p>Hand-picked cars with fresh promotional videos.</p>
          </div>
          <span className="section-pill">High-end inventory only</span>
        </div>
        {deals.length === 0 ? (
          <div className="empty">No exclusive deals published yet.</div>
        ) : (
          <>
            <div className="exclusive-grid">
              {deals.map((deal, index) => (
                <article className="video-card" key={deal.id}>
                  <div className="video-card__top">
                    <span>Featured Drop {String(index + 1).padStart(2, "0")}</span>
                    <span className="video-card__top-badge">Premium pick</span>
                  </div>
                  <div className="video-frame">
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
                      <div className="video-frame__placeholder">
                        Video coming soon
                      </div>
                    )}
                  </div>
                  <div className="video-card__body">
                    <div className="video-card__header">
                      <div>
                        <h3>
                          <Link
                            className="video-card__title-link"
                            href={`/exclusive-deals/${deal.id}`}
                          >
                            {deal.title}
                          </Link>
                        </h3>
                        <p>{deal.dealer}</p>
                        <span className="muted">{deal.city ?? ""}</span>
                      </div>
                      {deal.price ? (
                        <strong className="price-tag">{deal.price}</strong>
                      ) : null}
                    </div>
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
                    ) : null}
                    <div className="video-card__actions">
                      <Link
                        className="video-card__open-link"
                        href={`/exclusive-deals/${deal.id}`}
                      >
                        Open deal
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="brand-panel">
              <div className="brand-panel__header">
                <h3>Popular Brands in India</h3>
                <p>Tap a logo to browse that brand. Numbers show live available cars.</p>
              </div>
              <div className="brand-panel__grid">
                {brandStats.map((brand) => (
                  <Link
                    className="brand-button"
                    key={brand.key}
                    href={`/listings?q=${encodeURIComponent(brand.query)}`}
                  >
                    <span className="brand-button__logo">
                      <img src={brand.logo} alt={`${brand.name} logo`} loading="lazy" />
                    </span>
                    <span className="brand-button__name">{brand.name}</span>
                    <span className="brand-button__count">{brand.count} cars</span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      <section className="section exclusive-process">
        <div className="section__header">
          <div>
            <h2>How weekly features work</h2>
            <p>Simple, quick, and focused on real buyers.</p>
          </div>
        </div>
        <div className="exclusive-steps">
          {weeklySteps.map((step) => (
            <div className="exclusive-step" key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section__header section__header--split">
          <div>
            <h2>Next-gen retail tools</h2>
            <p>Everything needed for an all-India digital + showroom buying journey.</p>
          </div>
          <span className="section-pill">Digital showroom stack</span>
        </div>
        <div className="cards">
          {retailExperienceLinks.map((item) => (
            <article className="card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div>
                <Link className="btn btn--outline" href={item.href}>
                  Open
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section exclusive-cta">
        <div className="exclusive-cta__card">
          <div>
            <h2>Want your car featured next week?</h2>
            <p>
              We’ll visit, shoot the promo video, and push your listing to the
              front page. Limited slots per city.
            </p>
          </div>
          <div className="exclusive-cta__actions">
            <Link className="btn btn--solid" href="/dealer-admin/login">
              Dealer login
            </Link>
            <Link className="btn btn--outline" href="/listings">
              View all listings
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
