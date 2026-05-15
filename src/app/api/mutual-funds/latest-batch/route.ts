import { NextRequest, NextResponse } from "next/server";
import { fetchMutualFundSnapshot } from "@/lib/mfapi";

const uniqueCodes = (codes: string[]) => Array.from(new Set(codes.filter(Boolean)));

export async function GET(request: NextRequest) {
  const rawCodes = request.nextUrl.searchParams.get("scheme_codes")?.trim() ?? "";
  const schemeCodes = uniqueCodes(
    rawCodes
      .split(",")
      .map((code) => code.trim())
      .filter(Boolean),
  );

  if (!schemeCodes.length) {
    return NextResponse.json({ error: "scheme_codes is required." }, { status: 400 });
  }

  try {
    const funds = await Promise.all(schemeCodes.map((schemeCode) => fetchMutualFundSnapshot(schemeCode)));
    return NextResponse.json(
      {
        funds,
        refreshedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    console.error("MF latest batch fetch failed", { schemeCodes, error });
    return NextResponse.json({ error: "Failed to fetch latest NAV batch." }, { status: 500 });
  }
}
