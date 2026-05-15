import { NextResponse } from "next/server";
import { fetchAmfiNavMap } from "@/lib/amfi";

const watchlist = [
  {
    title: "Parag Parikh Flexi Cap Fund",
    matcher: "parag parikh flexi cap fund",
    category: "Flexi Cap",
    risk: "Moderate",
    expenseRatio: "0.63%",
    aum: "₹88,420 Cr",
    returns: { d1: "+0.34%", y1: "+18.2%" },
    chart: [28, 31, 33, 30, 35, 39, 41],
  },
  {
    title: "HDFC Balanced Advantage Fund",
    matcher: "hdfc balanced advantage fund",
    category: "Hybrid",
    risk: "Low to Moderate",
    expenseRatio: "0.79%",
    aum: "₹93,210 Cr",
    returns: { d1: "-0.12%", y1: "+13.4%" },
    chart: [22, 24, 23, 25, 26, 28, 29],
  },
  {
    title: "ICICI Prudential Bluechip Fund",
    matcher: "icici prudential bluechip fund",
    category: "Large Cap",
    risk: "Moderate",
    expenseRatio: "0.95%",
    aum: "₹61,100 Cr",
    returns: { d1: "+0.22%", y1: "+15.1%" },
    chart: [19, 21, 23, 22, 24, 27, 29],
  },
  {
    title: "SBI Small Cap Fund",
    matcher: "sbi small cap fund",
    category: "Small Cap",
    risk: "High",
    expenseRatio: "0.71%",
    aum: "₹31,400 Cr",
    returns: { d1: "+0.48%", y1: "+22.6%" },
    chart: [18, 20, 24, 23, 27, 32, 35],
  },
  {
    title: "Nippon India Large Cap Fund",
    matcher: "nippon india large cap fund",
    category: "Large Cap",
    risk: "Moderate",
    expenseRatio: "0.88%",
    aum: "₹19,820 Cr",
    returns: { d1: "-0.08%", y1: "+12.2%" },
    chart: [17, 18, 20, 19, 21, 24, 26],
  },
];

export async function GET() {
  try {
    const navMap = await fetchAmfiNavMap();
    const records = Array.from(navMap.values());

    const funds = watchlist.map((fund) => {
      const match = records.find((record) =>
        record.fundName.toLowerCase().includes(fund.matcher),
      );

      return {
        ...fund,
        nav: match?.nav ?? null,
        navDate: match?.navDate ?? null,
      };
    });

    return NextResponse.json(
      {
        marketStatus: "Closed · NAV updates daily after market close",
        refreshedAt: new Date().toISOString(),
        funds,
      },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Mutual fund preview fetch failed", error);
    return NextResponse.json(
      { error: "Could not load mutual fund preview right now." },
      { status: 500 },
    );
  }
}
