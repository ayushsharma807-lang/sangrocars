import type { MetadataRoute } from "next";
import { hasSupabaseConfig, supabaseServerOptional } from "@/lib/supabase";

type DealerRow = {
  id: string;
  name: string | null;
  dealer_name: string | null;
  company_name: string | null;
};

type ListingRow = {
  id: string;
  updated_at?: string | null;
  created_at?: string | null;
};

type ExclusiveDealRow = {
  id: string;
  updated_at?: string | null;
  created_at?: string | null;
};

const slugify = (name: string, id: string) =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}--${id}`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://sangrocars.in";
  const now = new Date();

  const urls: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/listings`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/sell`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${siteUrl}/deals-of-the-week`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${siteUrl}/dealers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  if (!hasSupabaseConfig()) return urls;
  const sb = supabaseServerOptional();
  if (!sb) return urls;

  const { data: listings } = await sb
    .from("listings")
    .select("id, updated_at, created_at")
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(200);

  (listings as ListingRow[] | null)?.forEach((listing) => {
    urls.push({
      url: `${siteUrl}/listing/${listing.id}`,
      lastModified: listing.updated_at ?? listing.created_at ?? now,
      changeFrequency: "daily",
      priority: 0.8,
    });
  });

  const { data: dealers } = await sb
    .from("dealers")
    .select("id, name, dealer_name, company_name")
    .order("updated_at", { ascending: false })
    .limit(200);

  (dealers as DealerRow[] | null)?.forEach((dealer) => {
    const name =
      dealer.name ?? dealer.dealer_name ?? dealer.company_name ?? "dealer";
    urls.push({
      url: `${siteUrl}/dealers/${slugify(name, dealer.id)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    });
  });

  const { data: exclusiveDeals } = await sb
    .from("exclusive_deals")
    .select("id, updated_at, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(100);

  (exclusiveDeals as ExclusiveDealRow[] | null)?.forEach((deal) => {
    urls.push({
      url: `${siteUrl}/exclusive-deals/${deal.id}`,
      lastModified: deal.updated_at ?? deal.created_at ?? now,
      changeFrequency: "weekly",
      priority: 0.75,
    });
  });

  return urls;
}
