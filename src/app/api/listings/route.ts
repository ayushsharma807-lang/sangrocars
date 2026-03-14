import { NextRequest, NextResponse } from "next/server";
import {
  attachDealerMeta,
  fetchPublicListingsPage,
  ListingsSearchParams,
  PAGE_SIZE,
} from "@/lib/publicListings";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const searchParams: ListingsSearchParams = {
    q: params.get("q") ?? undefined,
    min_price: params.get("min_price") ?? undefined,
    max_price: params.get("max_price") ?? undefined,
    price_mode: params.get("price_mode") ?? undefined,
    fuel: params.get("fuel") ?? undefined,
    transmission: params.get("transmission") ?? undefined,
    type: params.get("type") ?? undefined,
    year_min: params.get("year_min") ?? undefined,
    year_max: params.get("year_max") ?? undefined,
    city: params.get("city") ?? undefined,
    location: params.get("location") ?? undefined,
    budget: params.get("budget") ?? undefined,
    dealer_id: params.get("dealer_id") ?? undefined,
    verified: params.get("verified") ?? undefined,
    sort: params.get("sort") ?? undefined,
    compare: params.get("compare") ?? undefined,
    offset: params.get("offset") ?? undefined,
    limit: params.get("limit") ?? undefined,
  };

  const requestedLimit = Number(params.get("limit") ?? PAGE_SIZE) || PAGE_SIZE;
  const safeLimit = Math.min(Math.max(requestedLimit, 1), 24);

  const result = await fetchPublicListingsPage(searchParams, {
    offset: Number(params.get("offset") ?? 0) || 0,
    limit: safeLimit,
    includeCount: false,
  });

  if (result.error) {
    return NextResponse.json(
      { error: result.error, listings: [], hasMore: false },
      { status: 500 }
    );
  }

  const listings = await attachDealerMeta(result.listings);

  return NextResponse.json({
    listings,
    hasMore: result.hasMore,
  });
}
