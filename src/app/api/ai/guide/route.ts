import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

type RequestPayload = {
  question?: string;
  budget?: number;
};

type ListingRow = {
  id: string;
  make: string | null;
  model: string | null;
  variant: string | null;
  year: number | null;
  price: number | null;
  fuel: string | null;
  transmission: string | null;
  km: number | null;
  location: string | null;
};

const familyModelHints = [
  "innova",
  "carens",
  "ertiga",
  "xl6",
  "safari",
  "scorpio",
  "xuv700",
  "hector",
];

const suvHints = [
  "creta",
  "seltos",
  "xuv",
  "harrier",
  "taigun",
  "kushaq",
  "venue",
];

const hatchHints = ["baleno", "i20", "swift", "tiago", "polo"];

const sedanHints = ["city", "verna", "slavia", "virtus", "ciaz"];

const parseBudget = (question: string) => {
  const lowered = question.toLowerCase();
  const croreMatch = lowered.match(/(\d+(?:\.\d+)?)\s*(cr|crore)/);
  if (croreMatch) return Number(croreMatch[1]) * 10_000_000;

  const lakhMatch = lowered.match(/(\d+(?:\.\d+)?)\s*(l|lac|lakh)/);
  if (lakhMatch) return Number(lakhMatch[1]) * 100_000;

  const plain = lowered.match(/\b(\d{5,8})\b/);
  if (plain) return Number(plain[1]);

  return null;
};

const toTitle = (value?: string | null) =>
  value
    ? value
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "";

const normalize = (value?: string | null) =>
  (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();

const median = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[middle - 1] + sorted[middle]) / 2;
  return sorted[middle];
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as RequestPayload;
  const question = String(body.question ?? "").trim();
  const explicitBudget =
    typeof body.budget === "number" && Number.isFinite(body.budget) ? body.budget : null;
  const parsedBudget = parseBudget(question);
  const budget = explicitBudget ?? parsedBudget;
  const intent = question.toLowerCase();

  const wantsEv = /\bev\b|electric/.test(intent);
  const wantsSuv = /suv/.test(intent);
  const wantsSedan = /sedan/.test(intent);
  const wantsHatch = /(hatch|hatchback)/.test(intent);
  const familyUse = /(family|kids|child|7 seater|five|5)/.test(intent);
  const mileageFocus = /(mileage|efficiency|fuel economy)/.test(intent);

  const sb = supabaseServer();
  let query = sb
    .from("listings")
    .select("id, make, model, variant, year, price, fuel, transmission, km, location")
    .eq("status", "available")
    .limit(250);

  if (budget && budget > 0) query = query.lte("price", Math.round(budget * 1.15));
  if (wantsEv) query = query.ilike("fuel", "%electric%");

  const { data } = await query;
  const rows = ((data ?? []) as ListingRow[]).filter((row) => row.price && row.price > 0);

  const scored = rows
    .map((row) => {
      const makeModel = normalize(`${row.make ?? ""} ${row.model ?? ""}`);
      let score = 0;
      const reasons: string[] = [];

      if (budget && row.price && row.price <= budget) {
        score += 4;
        reasons.push("Within your budget");
      } else if (budget && row.price && row.price <= budget * 1.1) {
        score += 2;
        reasons.push("Very close to your budget");
      }

      if (wantsEv && normalize(row.fuel).includes("electric")) {
        score += 4;
        reasons.push("Matches EV preference");
      }

      if (familyUse && familyModelHints.some((hint) => makeModel.includes(hint))) {
        score += 3;
        reasons.push("Popular family-friendly option");
      }

      if (wantsSuv && suvHints.some((hint) => makeModel.includes(hint))) {
        score += 2;
        reasons.push("SUV-oriented recommendation");
      }

      if (wantsSedan && sedanHints.some((hint) => makeModel.includes(hint))) {
        score += 2;
        reasons.push("Sedan-oriented recommendation");
      }

      if (wantsHatch && hatchHints.some((hint) => makeModel.includes(hint))) {
        score += 2;
        reasons.push("Hatchback-oriented recommendation");
      }

      if (mileageFocus && normalize(row.fuel).includes("cng")) {
        score += 2;
        reasons.push("Fuel-efficient running cost profile");
      }

      if (row.km && row.km < 40_000) {
        score += 1;
        reasons.push("Lower running kilometers");
      }

      if (row.year && row.year >= 2021) {
        score += 1;
        reasons.push("Newer model year");
      }

      if (reasons.length === 0) reasons.push("Strong overall market fit");

      return { row, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const marketMedian = median(
    rows
      .map((row) => Number(row.price ?? 0))
      .filter((price) => Number.isFinite(price) && price > 0)
  );

  const recommendations = scored.map((item) => ({
    id: item.row.id,
    title: `${item.row.year ?? ""} ${toTitle(item.row.make)} ${toTitle(item.row.model)} ${toTitle(
      item.row.variant
    )}`.replace(/\s+/g, " ").trim(),
    price: item.row.price,
    location: item.row.location,
    reason: item.reasons.slice(0, 2).join(" • "),
  }));

  const summary = recommendations.length
    ? `I found ${recommendations.length} matches based on your budget and usage goals.`
    : "I could not find close matches yet. Try widening budget or removing one filter.";

  const marketInsight = marketMedian
    ? `Current median asking price in this shortlist is ₹${Math.round(marketMedian).toLocaleString(
        "en-IN"
      )}.`
    : "Not enough pricing data for a reliable market median yet.";

  return NextResponse.json({
    summary,
    marketInsight,
    recommendations,
    note: "This AI guide uses live listing data and rule-based matching.",
  });
}
