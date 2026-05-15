import "server-only";

import { fetchMutualFundSnapshot } from "@/lib/mfapi";

export type WealthCustomer = {
  id: string;
  profile_id?: string | null;
  name: string;
  phone?: string | null;
  email?: string | null;
  pan_placeholder?: string | null;
  city?: string | null;
  joined_date?: string | null;
  status: "active" | "inactive";
  created_at?: string;
};

export type WealthInvestment = {
  id: string;
  customer_id: string;
  fund_name: string;
  scheme_code?: string | null;
  investment_date: string;
  amount_invested: number;
  nav_on_investment_date: number;
  units_bought: number;
  transaction_type: "sip" | "lump_sum";
  notes?: string | null;
  created_at?: string;
  wealth_customers?: Pick<WealthCustomer, "id" | "name" | "phone" | "email"> | null;
};

export type WealthInvestmentValue = WealthInvestment & {
  latestNav: number | null;
  navDate: string | null;
  currentValue: number;
  profitLoss: number;
  returnPercent: number;
};

export const formatInr = (value?: number | null) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);

export const formatNumber = (value?: number | null, digits = 3) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0);

export const normalizePhone = (value?: FormDataEntryValue | string | null) =>
  String(value ?? "").replace(/\D/g, "");

export const toNumber = (value?: FormDataEntryValue | string | null) => {
  const parsed = Number.parseFloat(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const calculateUnits = (amount: number, nav: number) => {
  if (!Number.isFinite(amount) || !Number.isFinite(nav) || nav <= 0) return 0;
  return Number((amount / nav).toFixed(6));
};

export const calculateInvestmentValue = (
  investment: WealthInvestment,
  latestNav: number | null,
  navDate: string | null
): WealthInvestmentValue => {
  const currentValue = latestNav
    ? Number((investment.units_bought * latestNav).toFixed(2))
    : 0;
  const profitLoss = Number((currentValue - investment.amount_invested).toFixed(2));
  const returnPercent =
    investment.amount_invested > 0
      ? Number(((profitLoss / investment.amount_invested) * 100).toFixed(2))
      : 0;

  return {
    ...investment,
    latestNav,
    navDate,
    currentValue,
    profitLoss,
    returnPercent,
  };
};

export const enrichInvestmentsWithNav = async (
  investments: WealthInvestment[]
): Promise<WealthInvestmentValue[]> => {
  const schemeCodes = Array.from(
    new Set(
      investments
        .map((investment) => String(investment.scheme_code ?? "").trim())
        .filter(Boolean)
    )
  );

  const navMap = new Map<string, { latestNav: number | null; navDate: string | null }>();

  await Promise.all(
    schemeCodes.map(async (schemeCode) => {
      try {
        const snapshot = await fetchMutualFundSnapshot(schemeCode);
        navMap.set(schemeCode, {
          latestNav: snapshot.latestNav,
          navDate: snapshot.navDate,
        });
      } catch (error) {
        console.error("Wealth NAV fetch failed", { schemeCode, error });
        navMap.set(schemeCode, { latestNav: null, navDate: null });
      }
    })
  );

  return investments.map((investment) => {
    const schemeCode = String(investment.scheme_code ?? "").trim();
    const nav = navMap.get(schemeCode) ?? { latestNav: null, navDate: null };
    return calculateInvestmentValue(investment, nav.latestNav, nav.navDate);
  });
};
