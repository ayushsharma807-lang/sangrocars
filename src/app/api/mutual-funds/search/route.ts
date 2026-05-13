import { NextRequest, NextResponse } from "next/server";
import { searchMutualFunds } from "@/lib/mfapi";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ funds: [] });
  }

  try {
    const funds = await searchMutualFunds(query);
    return NextResponse.json(
      {
        funds,
        refreshedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=3600, stale-while-revalidate=43200",
        },
      },
    );
  } catch (error) {
    console.error("MF search failed", { query, error });
    return NextResponse.json({ error: "Failed to search funds." }, { status: 500 });
  }
}
