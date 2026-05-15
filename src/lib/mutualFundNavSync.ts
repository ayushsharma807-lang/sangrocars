import { lookupAmfiNavForCodes } from "@/lib/amfi";
import { supabaseServer } from "@/lib/supabase";

type SyncNavResult = {
  scanned: number;
  matched: number;
  updated: number;
  missingSchemeCodes: string[];
};

export async function syncMutualFundNavs(): Promise<SyncNavResult> {
  const sb = supabaseServer();
  const { data: holdings, error } = await sb
    .from("mutual_fund_holdings")
    .select("id, scheme_code, units, invested_amount");

  if (error) {
    throw new Error(error.message);
  }

  const validHoldings = (holdings ?? []).filter((holding) => holding.scheme_code);
  const schemeCodes = Array.from(
    new Set(validHoldings.map((holding) => String(holding.scheme_code)))
  );

  if (schemeCodes.length === 0) {
    return {
      scanned: holdings?.length ?? 0,
      matched: 0,
      updated: 0,
      missingSchemeCodes: [],
    };
  }

  const navMap = await lookupAmfiNavForCodes(schemeCodes);
  const now = new Date().toISOString();

  const updates = validHoldings
    .map((holding) => {
      const record = navMap.get(String(holding.scheme_code));
      if (!record) return null;

      const units = Number(holding.units ?? 0);
      const investedAmount = Number(holding.invested_amount ?? 0);
      const latestNav = Number(record.nav ?? 0);
      const currentValue = Number((units * latestNav).toFixed(2));
      const profitLoss = Number((currentValue - investedAmount).toFixed(2));

      return {
        id: holding.id,
        latest_nav: latestNav,
        current_value: currentValue,
        profit_loss: profitLoss,
        last_updated: now,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    latest_nav: number;
    current_value: number;
    profit_loss: number;
    last_updated: string;
  }>;

  for (const update of updates) {
    const { error: updateError } = await sb
      .from("mutual_fund_holdings")
      .update({
        latest_nav: update.latest_nav,
        current_value: update.current_value,
        profit_loss: update.profit_loss,
        last_updated: update.last_updated,
      })
      .eq("id", update.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  const missingSchemeCodes = schemeCodes.filter((code) => !navMap.has(code));

  return {
    scanned: holdings?.length ?? 0,
    matched: navMap.size,
    updated: updates.length,
    missingSchemeCodes,
  };
}
