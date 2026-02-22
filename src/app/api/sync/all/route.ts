import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { syncDealerInventory } from "@/lib/dealerSync";
import { runListingLifecycleCleanup } from "@/lib/listingLifecycle";

const SYNC_SECRET = process.env.SYNC_SECRET ?? "";
const DEFAULT_MAX = Number(process.env.SYNC_MAX_DEALERS_PER_RUN ?? "15");

export async function POST(req: Request) {
  if (!SYNC_SECRET) {
    return NextResponse.json(
      { ok: false, error: "SYNC_SECRET not configured" },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(req.url);
  const token = req.headers.get("x-sync-token") || searchParams.get("token") || "";
  if (token !== SYNC_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const mode = (searchParams.get("mode") ?? "auto").toLowerCase();
  const skipCleanup = searchParams.get("cleanup") === "0";
  const limitParam = Number(searchParams.get("limit") ?? DEFAULT_MAX);
  const offsetParam = Number(searchParams.get("offset") ?? 0);
  const limit = Number.isFinite(limitParam)
    ? Math.max(1, Math.min(limitParam, DEFAULT_MAX))
    : DEFAULT_MAX;
  const offset = Number.isFinite(offsetParam) ? Math.max(0, offsetParam) : 0;

  const sb = supabaseServer();
  const { data, error } = await sb.from("dealers").select("*");
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const dealers = (data ?? []).filter((dealer) =>
    Boolean(
      dealer.feed_url ||
        dealer.inventory_url ||
        dealer.sitemap_url ||
        dealer.scrape_url ||
        dealer.website_url
    )
  );

  const batch = dealers.slice(offset, offset + limit);
  const results = [] as {
    dealer_id: string;
    ok: boolean;
    rows?: number;
    mode?: string;
    scanned?: number;
    error?: string;
  }[];

  for (const dealer of batch) {
    const result = await syncDealerInventory(dealer, mode);
    results.push({ dealer_id: dealer.id, ...result });
  }

  const cleanup = skipCleanup
    ? null
    : await runListingLifecycleCleanup({
        soldAfterDays: Number(searchParams.get("sold_after_days") ?? NaN) || undefined,
        expireAfterDays:
          Number(searchParams.get("expire_after_days") ?? NaN) || undefined,
      });

  return NextResponse.json({
    ok: true,
    total: dealers.length,
    processed: batch.length,
    offset,
    limit,
    results,
    cleanup,
  });
}
