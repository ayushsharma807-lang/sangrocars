import type { MutualFundSnapshot } from "./types";
import MutualFundsClient from "./MutualFundsClient";
import { fetchMutualFundSnapshot } from "@/lib/mfapi";

export const revalidate = 43200;

const TOP_FUND_CODES = ["122639", "118778", "118955", "119835"];

const fallbackFund = (schemeCode: string): MutualFundSnapshot => ({
  schemeCode,
  schemeName: `Scheme ${schemeCode}`,
  fundHouse: null,
  category: null,
  latestNav: null,
  navDate: null,
  lastUpdated: new Date().toISOString(),
  returns: {
    oneDay: null,
    oneMonth: null,
    sixMonth: null,
    oneYear: null,
  },
  sparkline: [],
});

export default async function MutualFundsPage() {
  const initialFunds = await Promise.all(
    TOP_FUND_CODES.map(async (schemeCode) => {
      try {
        return await fetchMutualFundSnapshot(schemeCode);
      } catch (error) {
        console.error("Initial mutual fund snapshot failed", { schemeCode, error });
        return fallbackFund(schemeCode);
      }
    }),
  );

  return <MutualFundsClient initialFunds={initialFunds} />;
}
