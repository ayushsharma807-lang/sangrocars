import { parse } from "csv-parse/sync";
import * as cheerio from "cheerio";
import { createHash } from "crypto";
import { supabaseServer } from "@/lib/supabase";

type FeedRow = Record<string, unknown>;
type JsonLd = Record<string, unknown>;

type NormalizedListing = {
  stock_id: string;
  type: "new" | "used";
  make: string;
  model: string;
  variant: string | null;
  year: number | null;
  km: number | null;
  fuel: string | null;
  transmission: string | null;
  price: number | null;
  location: string | null;
  description: string | null;
  photo_urls: string[];
  status: "available" | "sold";
};

type DealerSyncRecord = {
  id: string;
  feed_url?: string | null;
  inventory_url?: string | null;
  sitemap_url?: string | null;
  scrape_url?: string | null;
  website_url?: string | null;
};

export type SyncResult = {
  ok: boolean;
  rows?: number;
  mode?: "feed" | "scrape";
  scanned?: number;
  error?: string;
};

const SCRAPE_MAX_LISTINGS = Number(process.env.SCRAPE_MAX_LISTINGS ?? "60");
const SCRAPE_DELAY_MS = Number(process.env.SCRAPE_DELAY_MS ?? "150");
const SCRAPE_USER_AGENT =
  process.env.SCRAPE_USER_AGENT ?? "CarHubBot/1.0";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const toString = (value: unknown) =>
  typeof value === "string"
    ? value.trim()
    : value == null
      ? ""
      : String(value).trim();

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const toType = (value: unknown) => {
  const v = toString(value).toLowerCase();
  return v === "new" ? "new" : "used";
};

const toStatus = (value: unknown) => {
  const v = toString(value).toLowerCase();
  if (
    [
      "sold",
      "inactive",
      "unavailable",
      "out_of_stock",
      "soldout",
    ].some((flag) => v.includes(flag))
  ) {
    return "sold";
  }
  if (v.includes("instock")) return "available";
  return v ? "available" : "available";
};

const toPhotos = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => toString(item)).filter(Boolean);
  }
  const str = toString(value);
  if (!str) return [];
  return str
    .split(/[\n,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const hashUrl = (url: string) =>
  createHash("sha1").update(url).digest("hex").slice(0, 16);

const parseCsv = (text: string) =>
  parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as FeedRow[];

const parseJson = (text: string) => {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data as FeedRow[];
  if (Array.isArray(data?.listings)) return data.listings as FeedRow[];
  if (Array.isArray(data?.items)) return data.items as FeedRow[];
  return [];
};

const normalizeRow = (row: FeedRow): NormalizedListing | null => {
  const stockId =
    toString(row.stock_id) ||
    toString(row.stockId) ||
    toString(row.id) ||
    toString(row.vin);
  if (!stockId) return null;

  const make = toString(row.make) || toString(row.brand);
  const model = toString(row.model) || toString(row.series);
  if (!make || !model) return null;

  return {
    stock_id: stockId,
    type: toType(row.type),
    make,
    model,
    variant: toString(row.variant) || null,
    year: toNumber(row.year),
    km: toNumber(row.km ?? row.kilometers ?? row.mileage),
    fuel: toString(row.fuel) || null,
    transmission: toString(row.transmission) || null,
    price: toNumber(row.price),
    location: toString(row.location) || null,
    description: toString(row.description) || null,
    photo_urls:
      row.photo_urls && Array.isArray(row.photo_urls)
        ? toPhotos(row.photo_urls)
        : toPhotos(row.photos ?? row.images),
    status: toStatus(row.status),
  };
};

const flattenJsonLd = (data: unknown): JsonLd[] => {
  if (!data) return [];
  if (Array.isArray(data)) {
    return data.flatMap((item) => flattenJsonLd(item));
  }
  if (typeof data === "object") {
    const graph = (data as { "@graph"?: unknown })["@graph"];
    if (Array.isArray(graph)) {
      return graph.flatMap((item) => flattenJsonLd(item));
    }
    return [data as JsonLd];
  }
  return [];
};

const parseJsonLdFromHtml = (html: string) => {
  const $ = cheerio.load(html);
  const items: JsonLd[] = [];
  $("script[type='application/ld+json']").each((_, element) => {
    const raw = $(element).contents().text().trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      items.push(...flattenJsonLd(parsed));
    } catch {
      // ignore invalid JSON-LD
    }
  });
  return items;
};

const isType = (entry: JsonLd, typeName: string) => {
  const raw = entry["@type"];
  if (Array.isArray(raw)) {
    return raw.some((value) =>
      String(value).toLowerCase().includes(typeName.toLowerCase())
    );
  }
  if (typeof raw === "string") {
    return raw.toLowerCase().includes(typeName.toLowerCase());
  }
  return false;
};

const extractItemListUrls = (items: JsonLd[]) => {
  const urls: string[] = [];
  for (const item of items) {
    if (!isType(item, "ItemList")) continue;
    const elements = item.itemListElement;
    if (!elements) continue;
    const list = Array.isArray(elements) ? elements : [elements];
    for (const element of list) {
      if (typeof element === "string") {
        urls.push(element);
        continue;
      }
      if (typeof element === "object" && element) {
        const url =
          (element as { url?: string; item?: { url?: string } }).url ||
          (element as { item?: { url?: string } }).item?.url;
        if (url) urls.push(url);
      }
    }
  }
  return urls;
};

const looksLikeListingUrl = (url: string) =>
  /(inventory|vehicle|used|new|car|listing|stock|detail|pre-owned)/i.test(url);

const resolveUrl = (href: string, base: string) => {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
};

const extractListingUrls = (html: string, baseUrl: string) => {
  const $ = cheerio.load(html);
  const baseOrigin = new URL(baseUrl).origin;
  const urls = new Set<string>();
  const keywordUrls = new Set<string>();

  const jsonLdUrls = extractItemListUrls(parseJsonLdFromHtml(html));
  jsonLdUrls.forEach((url) => {
    const resolved = resolveUrl(url, baseUrl);
    if (!resolved) return;
    if (new URL(resolved).origin !== baseOrigin) return;
    urls.add(resolved);
    if (looksLikeListingUrl(resolved)) keywordUrls.add(resolved);
  });

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || href.startsWith("#")) return;
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
    const resolved = resolveUrl(href, baseUrl);
    if (!resolved) return;
    if (new URL(resolved).origin !== baseOrigin) return;
    urls.add(resolved);
    if (looksLikeListingUrl(resolved)) keywordUrls.add(resolved);
  });

  const preferred = keywordUrls.size > 0 ? keywordUrls : urls;
  return Array.from(preferred);
};

const parseSitemapUrls = (xml: string, baseOrigin: string) => {
  const urls: string[] = [];
  const regex = /<loc>([^<]+)<\/loc>/gi;
  let match = regex.exec(xml);
  while (match) {
    const url = match[1].trim();
    if (url && url.startsWith(baseOrigin)) {
      urls.push(url);
    }
    match = regex.exec(xml);
  }
  return urls;
};

const parseNameParts = (name: string) => {
  const clean = name.replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const yearMatch = clean.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? Number(yearMatch[0]) : null;
  const withoutYear = yearMatch
    ? clean.replace(yearMatch[0], "").trim()
    : clean;
  const parts = withoutYear.split(" ").filter(Boolean);
  const make = parts[0] ?? "";
  const model = parts[1] ?? "";
  const variant = parts.slice(2).join(" ") || null;
  return { year, make, model, variant };
};

const pickOffer = (offers: unknown) => {
  if (!offers) return null;
  if (Array.isArray(offers)) return offers[0] ?? null;
  if (typeof offers === "object") return offers;
  return null;
};

const extractVehicleFromJsonLd = (
  items: JsonLd[],
  fallbackUrl: string
): NormalizedListing | null => {
  let best: JsonLd | null = null;
  let bestScore = -1;

  for (const item of items) {
    if (
      !isType(item, "Vehicle") &&
      !isType(item, "Car") &&
      !isType(item, "Product")
    ) {
      continue;
    }
    let score = 0;
    const offers = pickOffer(item.offers);
    if (offers && (offers as { price?: unknown }).price) score += 2;
    if (item.brand || item.make || item.manufacturer) score += 1;
    if (item.model || item.vehicleModel) score += 1;
    if (item.image) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (!best) return null;

  const offers = pickOffer(best.offers) as Record<string, unknown> | null;
  const name = toString(best.name);
  const parsed = parseNameParts(name);
  const make =
    toString(best.make) ||
    toString(best.brand) ||
    toString((best.brand as { name?: unknown } | undefined)?.name) ||
    toString(best.manufacturer) ||
    parsed.make;
  const model =
    toString(best.model) || toString(best.vehicleModel) || parsed.model;
  const variant = toString(best.variant) || parsed.variant || null;

  if (!make || !model) return null;

  const year =
    toNumber(best.vehicleModelDate) ||
    toNumber(best.productionDate) ||
    parsed.year;
  const km =
    toNumber((best as { mileage?: unknown }).mileage) ||
    toNumber(
      (best as { mileageFromOdometer?: { value?: unknown } })
        .mileageFromOdometer?.value
    );
  const fuel =
    toString(best.fuelType) || toString((best as { fuel?: unknown }).fuel) || null;
  const transmission =
    toString(best.vehicleTransmission) ||
    toString((best as { transmission?: unknown }).transmission) ||
    null;
  const price =
    toNumber(offers?.price) ||
    toNumber(
      (offers?.priceSpecification as { price?: unknown } | undefined)?.price
    ) ||
    null;
  const location =
    toString(
      (offers?.seller as { address?: { addressLocality?: unknown } } | undefined)
        ?.address?.addressLocality
    ) ||
    toString(
      (offers?.seller as { address?: { addressRegion?: unknown } } | undefined)
        ?.address?.addressRegion
    ) ||
    toString(
      (offers?.seller as { address?: { streetAddress?: unknown } } | undefined)
        ?.address?.streetAddress
    ) ||
    null;
  const description = toString(best.description) || null;
  const photo_urls = toPhotos(best.image ?? offers?.image);
  const rawStock =
    toString(best.sku) ||
    toString(best.productID) ||
    toString(best.mpn) ||
    toString(best.vehicleIdentificationNumber) ||
    toString((best as { vin?: unknown }).vin) ||
    toString(best["@id"]);
  const stock_id = rawStock || hashUrl(fallbackUrl);

  return {
    stock_id,
    type: toType(best.vehicleType ?? best.bodyType ?? "used"),
    make,
    model,
    variant,
    year,
    km,
    fuel,
    transmission,
    price,
    location,
    description,
    photo_urls,
    status: toStatus(offers?.availability ?? best.status ?? "available"),
  };
};

const fetchText = async (url: string) => {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "user-agent": SCRAPE_USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status})`);
  }
  return res.text();
};

const syncFeed = async (dealerId: string, feedUrl: string): Promise<SyncResult> => {
  const res = await fetch(feedUrl, { cache: "no-store" });
  if (!res.ok) {
    return { ok: false, error: "Feed fetch failed" };
  }

  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();
  const isJson =
    contentType.includes("application/json") ||
    feedUrl.toLowerCase().endsWith(".json");
  const rawRows = isJson ? parseJson(text) : parseCsv(text);

  const sb = supabaseServer();
  const now = new Date().toISOString();
  let processed = 0;

  for (const row of rawRows) {
    const normalized = normalizeRow(row);
    if (!normalized) continue;
    const payload = {
      source: "dealer_feed" as const,
      dealer_id: dealerId,
      stock_id: normalized.stock_id,
      type: normalized.type,
      make: normalized.make,
      model: normalized.model,
      variant: normalized.variant,
      year: normalized.year,
      km: normalized.km,
      fuel: normalized.fuel,
      transmission: normalized.transmission,
      price: normalized.price,
      location: normalized.location,
      description: normalized.description,
      photo_urls: normalized.photo_urls,
      status: normalized.status,
      last_seen_at: now,
    };

    await sb.from("listings").upsert(payload, {
      onConflict: "dealer_id,stock_id",
    });
    processed += 1;
  }

  return { ok: true, rows: processed, mode: "feed" };
};

const syncScrape = async (
  dealerId: string,
  inventoryUrl: string | null,
  sitemapUrl: string | null
): Promise<SyncResult> => {
  const baseUrl = inventoryUrl || sitemapUrl;
  if (!baseUrl) {
    return { ok: false, error: "Inventory URL missing" };
  }

  const baseOrigin = new URL(baseUrl).origin;
  const detailUrls = new Set<string>();

  try {
    if (sitemapUrl) {
      const xml = await fetchText(sitemapUrl);
      parseSitemapUrls(xml, baseOrigin)
        .filter(looksLikeListingUrl)
        .forEach((url) => detailUrls.add(url));
    }

    if (inventoryUrl) {
      const html = await fetchText(inventoryUrl);
      extractListingUrls(html, inventoryUrl).forEach((url) => {
        if (new URL(url).origin !== baseOrigin) return;
        if (looksLikeListingUrl(url)) detailUrls.add(url);
      });
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Scrape failed",
    };
  }

  const urls = Array.from(detailUrls).slice(0, SCRAPE_MAX_LISTINGS);
  if (urls.length === 0) {
    return { ok: false, error: "No listing URLs found" };
  }

  const sb = supabaseServer();
  const now = new Date().toISOString();
  let processed = 0;

  for (const url of urls) {
    try {
      const html = await fetchText(url);
      const jsonLd = parseJsonLdFromHtml(html);
      const listing = extractVehicleFromJsonLd(jsonLd, url);
      if (!listing) {
        await sleep(SCRAPE_DELAY_MS);
        continue;
      }

      const payload = {
        source: "dealer_scrape" as const,
        dealer_id: dealerId,
        stock_id: listing.stock_id,
        type: listing.type,
        make: listing.make,
        model: listing.model,
        variant: listing.variant,
        year: listing.year,
        km: listing.km,
        fuel: listing.fuel,
        transmission: listing.transmission,
        price: listing.price,
        location: listing.location,
        description: listing.description,
        photo_urls: listing.photo_urls,
        status: listing.status,
        last_seen_at: now,
      };

      await sb.from("listings").upsert(payload, {
        onConflict: "dealer_id,stock_id",
      });
      processed += 1;
      await sleep(SCRAPE_DELAY_MS);
    } catch {
      await sleep(SCRAPE_DELAY_MS);
    }
  }

  return { ok: true, rows: processed, mode: "scrape", scanned: urls.length };
};

export const syncDealerInventory = async (
  dealer: DealerSyncRecord,
  mode: string
): Promise<SyncResult> => {
  const feedUrl = toString(dealer.feed_url);
  const inventoryUrl = toString(
    dealer.inventory_url || dealer.scrape_url || dealer.website_url
  );
  const sitemapUrl = toString(dealer.sitemap_url);
  const normalizedMode = mode.toLowerCase();

  if ((normalizedMode === "feed" || (feedUrl && normalizedMode !== "scrape")) && feedUrl) {
    return syncFeed(dealer.id, feedUrl);
  }

  if (inventoryUrl || sitemapUrl) {
    return syncScrape(dealer.id, inventoryUrl || null, sitemapUrl || null);
  }

  return { ok: false, error: "No feed or inventory URL configured" };
};
