import { NextRequest, NextResponse } from "next/server";
import { fetchMutualFundHistory, fetchMutualFundSnapshot } from "@/lib/mfapi";

export async function GET(request: NextRequest) {
  const schemeCode = request.nextUrl.searchParams.get("scheme_code")?.trim();
  if (!schemeCode) {
    return NextResponse.json({ error: "scheme_code is required." }, { status: 400 });
  }

  try {
    const [historyResult, snapshot] = await Promise.all([
      fetchMutualFundHistory(schemeCode),
      fetchMutualFundSnapshot(schemeCode),
    ]);

    return NextResponse.json(
      {
        schemeCode: snapshot.schemeCode,
        schemeName: snapshot.schemeName,
        navDate: snapshot.navDate,
        latestNav: snapshot.latestNav,
        returns: snapshot.returns,
        history: historyResult.history,
        refreshedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=43200, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("MF history fetch failed", { schemeCode, error });
    return NextResponse.json({ error: "Failed to fetch NAV history." }, { status: 500 });
  }
}
