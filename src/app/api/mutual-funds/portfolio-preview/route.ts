import { NextResponse } from "next/server";
import { fetchMutualFundHistory } from "@/lib/mfapi";
import { getPortalSession } from "@/lib/servicesPortalAuth";
import { supabaseServer } from "@/lib/supabase";
import {
  enrichInvestmentsWithNav,
  type WealthInvestment,
  type WealthInvestmentValue,
} from "@/lib/wealth";
import type { MutualFundHistoryPoint } from "@/app/mutual-funds/types";

export const dynamic = "force-dynamic";

type GrowthPoint = {
  date: string;
  value: number;
};

const noStoreHeaders = {
  "Cache-Control": "private, no-store",
};

const toNumericInvestment = (investment: WealthInvestment): WealthInvestment => ({
  ...investment,
  amount_invested: Number(investment.amount_invested) || 0,
  nav_on_investment_date: Number(investment.nav_on_investment_date) || 0,
  units_bought: Number(investment.units_bought) || 0,
});

const pickLatestDate = (investments: WealthInvestmentValue[]) => {
  const dates = investments
    .map((investment) => investment.navDate)
    .filter(Boolean)
    .sort() as string[];

  return dates.at(-1) ?? null;
};

const buildPortfolioGrowth = async (
  investments: WealthInvestmentValue[]
): Promise<GrowthPoint[]> => {
  const schemeCodes = Array.from(
    new Set(
      investments
        .map((investment) => String(investment.scheme_code ?? "").trim())
        .filter(Boolean)
    )
  ).slice(0, 8);

  const historyEntries: Array<readonly [string, MutualFundHistoryPoint[]]> = await Promise.all(
    schemeCodes.map(async (schemeCode) => {
      try {
        const result = await fetchMutualFundHistory(schemeCode);
        const sampled = result.history.slice(-36);
        return [schemeCode, sampled] as const;
      } catch (error) {
        console.error("Portfolio history fetch failed", { schemeCode, error });
        return [schemeCode, [] as MutualFundHistoryPoint[]] as const;
      }
    })
  );

  const histories = new Map(historyEntries);
  const growthByIndex = new Map<number, { date: string; value: number }>();

  for (const investment of investments) {
    const schemeCode = String(investment.scheme_code ?? "").trim();
    const history = histories.get(schemeCode) ?? [];
    if (!history.length || investment.units_bought <= 0) continue;

    history.forEach((point, index) => {
      const existing = growthByIndex.get(index) ?? { date: point.date, value: 0 };
      growthByIndex.set(index, {
        date: existing.date || point.date,
        value: Number((existing.value + investment.units_bought * point.nav).toFixed(2)),
      });
    });
  }

  return Array.from(growthByIndex.entries())
    .sort(([left], [right]) => left - right)
    .map(([, point]) => point)
    .filter((point) => point.value > 0);
};

export async function GET() {
  const session = await getPortalSession();

  if (!session || session.profile.role !== "customer") {
    return NextResponse.json(
      {
        status: "anonymous",
        refreshedAt: new Date().toISOString(),
      },
      { headers: noStoreHeaders }
    );
  }

  try {
    const sb = supabaseServer();

    let { data: customer, error: customerError } = await sb
      .from("wealth_customers")
      .select("id,name,email,phone,city,status")
      .eq("profile_id", session.profile.id)
      .maybeSingle();

    if (customerError) throw customerError;

    if (!customer && session.profile.email) {
      const byEmail = await sb
        .from("wealth_customers")
        .select("id,name,email,phone,city,status")
        .eq("email", session.profile.email)
        .maybeSingle();

      if (byEmail.error) throw byEmail.error;
      customer = byEmail.data ?? null;

      if (customer?.id) {
        await sb
          .from("wealth_customers")
          .update({ profile_id: session.profile.id })
          .eq("id", customer.id);
      }
    }

    if (!customer?.id) {
      return NextResponse.json(
        {
          status: "empty",
          customerName: session.profile.name,
          refreshedAt: new Date().toISOString(),
        },
        { headers: noStoreHeaders }
      );
    }

    const { data, error } = await sb
      .from("wealth_investments")
      .select(
        "id,customer_id,fund_name,scheme_code,investment_date,amount_invested,nav_on_investment_date,units_bought,transaction_type,notes,created_at"
      )
      .eq("customer_id", customer.id)
      .order("investment_date", { ascending: true });

    if (error) throw error;

    const rawInvestments = ((data ?? []) as WealthInvestment[]).map(toNumericInvestment);

    if (!rawInvestments.length) {
      return NextResponse.json(
        {
          status: "empty",
          customerName: customer.name ?? session.profile.name,
          refreshedAt: new Date().toISOString(),
        },
        { headers: noStoreHeaders }
      );
    }

    const investments = await enrichInvestmentsWithNav(rawInvestments);
    const growth = await buildPortfolioGrowth(investments);
    const totalInvested = investments.reduce(
      (sum, investment) => sum + investment.amount_invested,
      0
    );
    const totalCurrentValue = investments.reduce(
      (sum, investment) => sum + investment.currentValue,
      0
    );
    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalReturnPercent =
      totalInvested > 0 ? Number(((totalProfitLoss / totalInvested) * 100).toFixed(2)) : 0;

    return NextResponse.json(
      {
        status: "ready",
        customerName: customer.name ?? session.profile.name,
        summary: {
          invested: Number(totalInvested.toFixed(2)),
          currentValue: Number(totalCurrentValue.toFixed(2)),
          profitLoss: Number(totalProfitLoss.toFixed(2)),
          returnPercent: totalReturnPercent,
        },
        investments: investments.map((investment) => ({
          id: investment.id,
          customerId: investment.customer_id,
          fundName: investment.fund_name,
          schemeCode: investment.scheme_code ?? "",
          investmentDate: investment.investment_date,
          amountInvested: investment.amount_invested,
          navAtPurchase: investment.nav_on_investment_date,
          unitsBought: investment.units_bought,
          transactionType: investment.transaction_type,
          latestNav: investment.latestNav,
          navDate: investment.navDate,
          currentValue: investment.currentValue,
          profitLoss: investment.profitLoss,
          returnPercent: investment.returnPercent,
        })),
        growth,
        lastNavDate: pickLatestDate(investments),
        refreshedAt: new Date().toISOString(),
      },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error("Portfolio preview failed", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Could not load portfolio",
        refreshedAt: new Date().toISOString(),
      },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
