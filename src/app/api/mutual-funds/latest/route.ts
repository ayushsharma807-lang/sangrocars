import { NextRequest, NextResponse } from "next/server";
import { fetchMutualFundSnapshot } from "@/lib/mfapi";

export async function GET(request: NextRequest) {
  const schemeCode = request.nextUrl.searchParams.get("scheme_code")?.trim();
  if (!schemeCode) {
    return NextResponse.json({ error: "scheme_code is required." }, { status: 400 });
  }

  try {
    const fund = await fetchMutualFundSnapshot(schemeCode);
    return NextResponse.json(
      {
        fund,
        refreshedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=43200, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("MF latest fetch failed", { schemeCode, error });
    return NextResponse.json({ error: "Failed to fetch latest NAV." }, { status: 500 });
  }
}
