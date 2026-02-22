import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { buildTradeInValuation } from "@/lib/tradeInProviders";

type RequestPayload = {
  vin?: string;
  make?: string;
  model?: string;
  year?: number;
  km?: number;
  condition?: "excellent" | "good" | "fair";
  currentPrice?: number;
  postalCode?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as RequestPayload;
  const make = String(body.make ?? "").trim();
  const model = String(body.model ?? "").trim();
  const vin = String(body.vin ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
  const year = clamp(toNumber(body.year) ?? new Date().getFullYear() - 4, 1995, 2030);
  const km = clamp(toNumber(body.km) ?? 0, 0, 500_000);
  const suppliedPrice = toNumber(body.currentPrice);
  const postalCode = String(body.postalCode ?? "").replace(/[^0-9A-Za-z-]/g, "").trim();
  const condition = body.condition ?? "good";

  const sb = supabaseServer();
  let query = sb
    .from("listings")
    .select("price")
    .eq("status", "available")
    .not("price", "is", null)
    .limit(250);

  if (make) query = query.ilike("make", `%${make}%`);
  if (model) query = query.ilike("model", `%${model}%`);

  const { data } = await query;
  const marketPrices = (data ?? [])
    .map((row) => Number((row as { price?: number | null }).price ?? 0))
    .filter((price) => Number.isFinite(price) && price > 0);

  const valuation = await buildTradeInValuation({
    vin,
    make,
    model,
    year,
    km,
    condition,
    currentPrice: suppliedPrice,
    postalCode,
    marketPrices,
  });

  return NextResponse.json({
    low: valuation.low,
    high: valuation.high,
    expected: valuation.expected,
    confidence: valuation.confidence,
    notes: valuation.notes,
    provider: valuation.provider,
  });
}
