"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ServiceLeadForm from "@/app/components/ServiceLeadForm";
import type { MutualFundSearchResult, MutualFundSnapshot } from "./types";

type Props = {
  initialFunds: MutualFundSnapshot[];
};

type PortfolioHolding = {
  schemeCode: string;
  units: number;
  averageNav: number;
  sipAmount: number;
};

type SearchState =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "done"; funds: MutualFundSnapshot[]; searchedAt: string };

const DEFAULT_PORTFOLIO: PortfolioHolding[] = [
  { schemeCode: "122639", units: 126.4, averageNav: 74.2, sipAmount: 3000 },
  { schemeCode: "118778", units: 84.2, averageNav: 121.5, sipAmount: 2500 },
  { schemeCode: "118955", units: 52.6, averageNav: 1128.4, sipAmount: 4000 },
  { schemeCode: "119835", units: 63.1, averageNav: 301.2, sipAmount: 2200 },
];

const FUND_RISK: Record<string, string> = {
  "122639": "Moderate",
  "118778": "Very high",
  "118955": "Moderate",
  "119835": "High",
};

const faqs = [
  {
    question: "What is SIP?",
    answer:
      "A SIP is a disciplined way to invest a fixed amount regularly into a mutual fund. It helps smooth market volatility and build wealth gradually.",
  },
  {
    question: "Why does NAV not move like a stock price?",
    answer:
      "Mutual fund NAV is published once each trading day after the market closes. We can check for updates often, but the source NAV itself is usually daily.",
  },
  {
    question: "Can I invest directly here today?",
    answer:
      "Not yet. This SangroCars Wealth experience is currently for tracking, discovery, and service requests. Live investing flows can be layered in later.",
  },
  {
    question: "What happens after I request a SIP or withdrawal?",
    answer:
      "Your request goes to the SangroCars team for follow-up and coordination on the official platform. We keep the interface simple while the workflow stays compliant.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatNav = (value: number | null) => {
  if (value === null) return "NAV unavailable";
  return `₹${value.toFixed(2)}`;
};

const formatPercent = (value: number | null) => {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const formatDateTime = (value: string | null) => {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
};

const formatNavDate = (value: string | null) => {
  if (!value) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const sparklinePath = (values: number[]) => {
  if (!values.length) return "";
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 42 - ((value - min) / range) * 38;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
};

const trendTone = (value: number | null) => {
  if (value === null) return "bg-slate-100 text-slate-500";
  if (value >= 0) return "bg-emerald-50 text-emerald-700";
  return "bg-rose-50 text-rose-600";
};

const getPortfolioRows = (funds: MutualFundSnapshot[]) => {
  const fundMap = new Map(funds.map((fund) => [fund.schemeCode, fund]));

  return DEFAULT_PORTFOLIO.map((holding) => {
    const fund = fundMap.get(holding.schemeCode);
    const investedAmount = holding.units * holding.averageNav;
    const latestNav = fund?.latestNav ?? holding.averageNav;
    const currentValue = holding.units * latestNav;
    const profitLoss = currentValue - investedAmount;
    const returnPercent = investedAmount > 0 ? (profitLoss / investedAmount) * 100 : 0;

    return {
      ...holding,
      schemeName: fund?.schemeName ?? `Scheme ${holding.schemeCode}`,
      latestNav,
      investedAmount,
      currentValue,
      profitLoss,
      returnPercent,
      navDate: fund?.navDate ?? null,
    };
  });
};

function SectionHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">{copy}</p>
    </div>
  );
}

export default function MutualFundsClient({ initialFunds }: Props) {
  const [monthlyInvestment, setMonthlyInvestment] = useState("10000");
  const [years, setYears] = useState("10");
  const [expectedReturn, setExpectedReturn] = useState("12");
  const [activeFaq, setActiveFaq] = useState(0);
  const [activeTab, setActiveTab] = useState<"watchlist" | "portfolio" | "sips" | "requests">("watchlist");
  const [trackedCodes, setTrackedCodes] = useState<string[]>(() => initialFunds.map((fund) => fund.schemeCode));
  const [watchlistFunds, setWatchlistFunds] = useState(initialFunds);
  const [refreshState, setRefreshState] = useState<"idle" | "refreshing" | "failed">("idle");
  const [lastCheckedAt, setLastCheckedAt] = useState(new Date().toISOString());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState>({ state: "idle" });

  const calculator = useMemo(() => {
    const monthly = Number.parseFloat(monthlyInvestment || "0");
    const totalYears = Number.parseFloat(years || "0");
    const annual = Number.parseFloat(expectedReturn || "0");
    const months = Math.max(Math.round(totalYears * 12), 0);
    const monthlyRate = annual / 12 / 100;
    const invested = monthly * months;
    const futureValue =
      monthlyRate > 0
        ? monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate)
        : invested;
    const returns = Math.max(futureValue - invested, 0);
    return { invested, futureValue, returns };
  }, [expectedReturn, monthlyInvestment, years]);

  const portfolioRows = useMemo(() => getPortfolioRows(watchlistFunds), [watchlistFunds]);

  const portfolioSummary = useMemo(() => {
    const invested = portfolioRows.reduce((sum, row) => sum + row.investedAmount, 0);
    const currentValue = portfolioRows.reduce((sum, row) => sum + row.currentValue, 0);
    const profitLoss = currentValue - invested;
    const returnPercent = invested > 0 ? (profitLoss / invested) * 100 : 0;
    return { invested, currentValue, profitLoss, returnPercent };
  }, [portfolioRows]);

  const latestNavDate = useMemo(() => {
    const dates = watchlistFunds.map((fund) => fund.navDate).filter(Boolean) as string[];
    if (!dates.length) return null;
    return dates.sort().at(-1) ?? null;
  }, [watchlistFunds]);

  const allocation = useMemo(() => {
    const total = portfolioSummary.currentValue || 1;
    return portfolioRows.map((row) => ({
      schemeCode: row.schemeCode,
      label: row.schemeName,
      share: (row.currentValue / total) * 100,
    }));
  }, [portfolioRows, portfolioSummary.currentValue]);

  const refreshWatchlist = async () => {
    setRefreshState("refreshing");
    try {
      const refreshed = await Promise.all(
        trackedCodes.map(async (schemeCode) => {
          const response = await fetch(`/api/mutual-funds/latest?scheme_code=${schemeCode}`);
          if (!response.ok) {
            throw new Error(`Failed to refresh ${schemeCode}`);
          }
          const data = await response.json();
          return data.fund as MutualFundSnapshot;
        }),
      );
      setWatchlistFunds(refreshed);
      setLastCheckedAt(new Date().toISOString());
      setRefreshState("idle");
    } catch (error) {
      console.error("Watchlist refresh failed", error);
      setRefreshState("failed");
    }
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      void refreshWatchlist();
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [trackedCodes]);

  const handleTrackFund = (fund: MutualFundSnapshot) => {
    setTrackedCodes((current) => (current.includes(fund.schemeCode) ? current : [...current, fund.schemeCode]));
    setWatchlistFunds((current) => {
      const exists = current.some((item) => item.schemeCode === fund.schemeCode);
      return exists ? current : [...current, fund];
    });
    setActiveTab("watchlist");
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchState({ state: "error", message: "Enter a fund name to search." });
      return;
    }

    setSearchState({ state: "loading" });
    try {
      const searchResponse = await fetch(`/api/mutual-funds/search?q=${encodeURIComponent(query)}`);
      if (!searchResponse.ok) throw new Error("Search failed");
      const searchPayload = (await searchResponse.json()) as { funds: MutualFundSearchResult[] };
      const topResults = searchPayload.funds.slice(0, 5);

      const funds = await Promise.all(
        topResults.map(async (result) => {
          const latestResponse = await fetch(`/api/mutual-funds/latest?scheme_code=${result.schemeCode}`);
          if (!latestResponse.ok) throw new Error(`Latest fetch failed for ${result.schemeCode}`);
          const latestPayload = await latestResponse.json();
          return latestPayload.fund as MutualFundSnapshot;
        }),
      );

      setSearchState({ state: "done", funds, searchedAt: new Date().toISOString() });
    } catch (error) {
      console.error("Fund search flow failed", error);
      setSearchState({ state: "error", message: "Failed to fetch NAV. Please try again." });
    }
  };

  const tabButtons = [
    { id: "watchlist", label: "Watchlist" },
    { id: "portfolio", label: "Portfolio" },
    { id: "sips", label: "SIPs" },
    { id: "requests", label: "Requests" },
  ] as const;

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.12),transparent_34%),linear-gradient(180deg,#f8fffb_0%,#ffffff_38%)]">
        <header className="sticky top-0 z-40 border-b border-emerald-100/70 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/images/sangrocars-logo.png"
                alt="SangroCars"
                className="h-11 w-11 rounded-2xl border border-emerald-100 object-contain p-1"
              />
              <div>
                <div className="text-lg font-semibold tracking-tight text-slate-950">SangroCars Wealth</div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Mutual Funds</div>
              </div>
            </Link>

            <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
              <a href="#watchlist" className="transition hover:text-emerald-600">Watchlist</a>
              <a href="#sip-calculator" className="transition hover:text-emerald-600">SIP Calculator</a>
              <a href="#explore-funds" className="transition hover:text-emerald-600">Explore Funds</a>
              <Link href="/mutual-funds/onboarding" className="transition hover:text-emerald-600">Login</Link>
              <Link
                href="/mutual-funds/onboarding"
                className="rounded-full bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-2 text-white shadow-[0_10px_30px_rgba(34,197,94,0.22)] transition hover:scale-[1.01]"
              >
                Sign up
              </Link>
            </nav>

            <div className="flex items-center gap-2 lg:hidden">
              <Link href="/mutual-funds/onboarding" className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700">
                Login
              </Link>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.55, ease: "easeOut" }}>
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                Live Mutual Fund Tracker
              </span>
              <h1 className="mt-6 max-w-2xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                Build wealth, SIP by SIP.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Explore real daily NAV data with SangroCars Wealth, monitor return windows that matter, and preview how a disciplined SIP strategy can grow over time.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/mutual-funds/onboarding"
                  className="rounded-full bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(34,197,94,0.25)] transition hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
                <a
                  href="#explore-funds"
                  className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:text-emerald-700"
                >
                  Explore Funds
                </a>
              </div>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-500">
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Auto-refresh every 60 seconds</span>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Market closed · NAV updates daily</span>
                <span className="rounded-full border border-slate-200 bg-white px-4 py-2">Last NAV updated {formatNavDate(latestNavDate)}</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
              className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-[0_28px_60px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Demo portfolio preview</p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{formatMoney(portfolioSummary.currentValue)}</h2>
                </div>
                <span className={`rounded-full px-4 py-2 text-sm font-semibold ${trendTone(portfolioSummary.returnPercent)}`}>
                  {formatPercent(portfolioSummary.returnPercent)} overall
                </span>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-sm text-slate-500">Invested</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{formatMoney(portfolioSummary.invested)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-sm text-slate-500">Current value</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{formatMoney(portfolioSummary.currentValue)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-sm text-slate-500">Profit / loss</p>
                  <p className={`mt-2 text-xl font-semibold ${portfolioSummary.profitLoss >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {portfolioSummary.profitLoss >= 0 ? "+" : ""}
                    {formatMoney(portfolioSummary.profitLoss)}
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-950 px-5 py-6 text-white">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>Growth trajectory</span>
                  <span>Last sync {formatDateTime(lastCheckedAt)}</span>
                </div>
                <svg viewBox="0 0 100 42" className="mt-5 h-36 w-full overflow-visible">
                  <defs>
                    <linearGradient id="portfolioLine" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0,34 C10,30 18,26 28,22 C38,18 44,20 53,16 C64,11 72,14 82,10 C90,8 95,6 100,4"
                    fill="none"
                    stroke="url(#portfolioLine)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0,42 L0,34 C10,30 18,26 28,22 C38,18 44,20 53,16 C64,11 72,14 82,10 C90,8 95,6 100,4 L100,42 Z"
                    fill="rgba(74, 222, 128, 0.14)"
                  />
                </svg>
                <div className="mt-4 flex items-center justify-between text-sm text-white/70">
                  <span>Daily auto-check enabled</span>
                  <span>Portfolio preview only</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <section id="watchlist" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              eyebrow="Track live-style NAV"
              title="Watchlist powered by real daily NAV data"
              copy="Search any scheme, refresh the tracked cards, and monitor 1 day, 1 month, 6 month, and 1 year return windows without leaving SangroCars Wealth."
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void refreshWatchlist()}
                className="rounded-full border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={refreshState === "refreshing"}
              >
                {refreshState === "refreshing" ? "Loading NAV..." : "Refresh watchlist"}
              </button>
              <span className="text-sm text-slate-500">Checked {formatDateTime(lastCheckedAt)}</span>
            </div>
          </div>

          <form onSubmit={handleSearch} className="mt-8 grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 lg:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Search mutual fund by name</span>
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search mutual fund by name"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 lg:self-end"
            >
              {searchState.state === "loading" ? "Loading NAV..." : "Search funds"}
            </button>
          </form>

          {searchState.state === "error" && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Failed to fetch NAV · {searchState.message}
            </div>
          )}

          {searchState.state === "done" && (
            <div className="mt-5 rounded-[28px] border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">Search results</h3>
                  <p className="text-sm text-slate-500">Last updated {formatDateTime(searchState.searchedAt)}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  {searchState.funds.length} funds ready to track
                </span>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {searchState.funds.map((fund) => (
                  <div key={fund.schemeCode} className="rounded-3xl border border-slate-200 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-slate-950">{fund.schemeName}</p>
                        <p className="mt-1 text-sm text-slate-500">Scheme code {fund.schemeCode}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTrackFund(fund)}
                        className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        Track fund
                      </button>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${trendTone(fund.returns.oneDay)}`}>
                        1D {formatPercent(fund.returns.oneDay)}
                      </span>
                      <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${trendTone(fund.returns.oneMonth)}`}>
                        1M {formatPercent(fund.returns.oneMonth)}
                      </span>
                      <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${trendTone(fund.returns.oneYear)}`}>
                        1Y {formatPercent(fund.returns.oneYear)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-2">
            {tabButtons.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "watchlist" && (
            <div id="explore-funds" className="mt-8 grid gap-5 xl:grid-cols-2">
              {watchlistFunds.map((fund) => (
                <motion.article
                  key={fund.schemeCode}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={fadeUp}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                          {FUND_RISK[fund.schemeCode] ?? "Tracked"} risk
                        </span>
                        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500">
                          Scheme code {fund.schemeCode}
                        </span>
                      </div>
                      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{fund.schemeName}</h3>
                      <p className="mt-2 text-sm text-slate-500">{fund.fundHouse ?? "Mutual fund"}</p>
                    </div>
                    <div className="min-w-[150px] rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Latest NAV</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950">{formatNav(fund.latestNav)}</p>
                      <p className="mt-2 text-sm text-slate-500">NAV date {formatNavDate(fund.navDate)}</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-4">
                    {[
                      { label: "1D", value: fund.returns.oneDay },
                      { label: "1M", value: fund.returns.oneMonth },
                      { label: "6M", value: fund.returns.sixMonth },
                      { label: "1Y", value: fund.returns.oneYear },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label} return</p>
                        <p className={`mt-2 text-lg font-semibold ${item.value !== null && item.value < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {formatPercent(item.value)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[28px] border border-slate-200 bg-slate-950 px-5 py-5 text-white">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>Historical NAV trend</span>
                      <span>Last updated {formatDateTime(fund.lastUpdated)}</span>
                    </div>
                    <svg viewBox="0 0 100 42" className="mt-5 h-28 w-full">
                      <defs>
                        <linearGradient id={`spark-${fund.schemeCode}`} x1="0%" x2="100%" y1="0%" y2="0%">
                          <stop offset="0%" stopColor="#4ade80" />
                          <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                      </defs>
                      {fund.sparkline.length ? (
                        <>
                          <path
                            d={`${sparklinePath(fund.sparkline)} L100,42 L0,42 Z`}
                            fill="rgba(74, 222, 128, 0.12)"
                          />
                          <path
                            d={sparklinePath(fund.sparkline)}
                            fill="none"
                            stroke={`url(#spark-${fund.schemeCode})`}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </>
                      ) : (
                        <text x="50" y="24" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="6">
                          NAV history unavailable
                        </text>
                      )}
                    </svg>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          {activeTab === "portfolio" && (
            <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-950">Portfolio preview</h3>
                    <p className="mt-2 text-sm text-slate-500">Current value is derived from units owned × latest NAV. Profit / loss is current value minus invested amount.</p>
                  </div>
                  <span className={`rounded-full px-4 py-2 text-sm font-semibold ${trendTone(portfolioSummary.returnPercent)}`}>
                    {formatPercent(portfolioSummary.returnPercent)} total return
                  </span>
                </div>

                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      <tr>
                        <th className="pb-3 font-medium">Fund</th>
                        <th className="pb-3 font-medium">Units</th>
                        <th className="pb-3 font-medium">Avg NAV</th>
                        <th className="pb-3 font-medium">Current NAV</th>
                        <th className="pb-3 font-medium">Invested amount</th>
                        <th className="pb-3 font-medium">Current value</th>
                        <th className="pb-3 font-medium">Profit / loss</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {portfolioRows.map((row) => (
                        <tr key={row.schemeCode}>
                          <td className="py-4 pr-4">
                            <p className="font-semibold text-slate-950">{row.schemeName}</p>
                            <p className="mt-1 text-xs text-slate-500">NAV date {formatNavDate(row.navDate)}</p>
                          </td>
                          <td className="py-4 pr-4">{row.units.toFixed(2)}</td>
                          <td className="py-4 pr-4">{formatNav(row.averageNav)}</td>
                          <td className="py-4 pr-4">{formatNav(row.latestNav)}</td>
                          <td className="py-4 pr-4">{formatMoney(row.investedAmount)}</td>
                          <td className="py-4 pr-4">{formatMoney(row.currentValue)}</td>
                          <td className={`py-4 pr-4 font-semibold ${row.profitLoss >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {row.profitLoss >= 0 ? "+" : ""}
                            {formatMoney(row.profitLoss)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-5">
                <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                  <h3 className="text-xl font-semibold text-slate-950">Allocation snapshot</h3>
                  <div className="mt-6 space-y-4">
                    {allocation.map((item) => (
                      <div key={item.schemeCode}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">{item.label}</span>
                          <span className="text-slate-500">{item.share.toFixed(1)}%</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400" style={{ width: `${Math.max(item.share, 6)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                  <h3 className="text-xl font-semibold text-slate-950">Health check</h3>
                  <ul className="mt-4 space-y-3 text-sm text-slate-600">
                    <li>• XIRR placeholder ready for future integration</li>
                    <li>• SIP reminder stack can be attached to tracked funds later</li>
                    <li>• Portfolio chart will support actual customer holdings after login</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sips" && (
            <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
              {portfolioRows.map((row) => (
                <div key={row.schemeCode} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
                  <p className="text-sm font-semibold text-slate-950">{row.schemeName}</p>
                  <p className="mt-2 text-sm text-slate-500">Monthly SIP {formatMoney(row.sipAmount)}</p>
                  <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Next debit cycle ready. Use “Add SIP Request” below if you want to change the amount.</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "requests" && (
            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              {[
                {
                  title: "Track Fund",
                  copy: "Ask us to add a new scheme to your tracked dashboard and follow its NAV updates.",
                },
                {
                  title: "Add SIP Request",
                  copy: "Share the SIP amount you want to begin so the SangroCars team can coordinate the next step.",
                },
                {
                  title: "Withdrawal Request",
                  copy: "Start a withdrawal support request and we’ll help you handle the official process.",
                },
              ].map((card) => (
                <div key={card.title} className="rounded-[28px] border border-slate-200 bg-slate-50/70 p-5">
                  <h3 className="text-lg font-semibold text-slate-950">{card.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.copy}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="sip-calculator" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.05)] sm:p-8">
            <SectionHeader
              eyebrow="SIP Calculator"
              title="Estimate your long-term wealth path"
              copy="Adjust your monthly investment, expected return, and time horizon to preview a disciplined SIP plan."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Monthly investment</span>
                <input value={monthlyInvestment} onChange={(event) => setMonthlyInvestment(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400" inputMode="numeric" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Years</span>
                <input value={years} onChange={(event) => setYears(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400" inputMode="numeric" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Expected return %</span>
                <input value={expectedReturn} onChange={(event) => setExpectedReturn(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400" inputMode="decimal" />
              </label>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_28px_70px_rgba(15,23,42,0.12)] sm:p-8">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-white/70">Total invested</p>
                <p className="mt-3 text-2xl font-semibold">{formatMoney(calculator.invested)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-white/70">Estimated returns</p>
                <p className="mt-3 text-2xl font-semibold text-emerald-300">{formatMoney(calculator.returns)}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-white/70">Wealth gained</p>
                <p className="mt-3 text-2xl font-semibold">{formatMoney(calculator.futureValue)}</p>
              </div>
            </div>
            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/75">
              This is a projection for planning. Real returns depend on market conditions, holding period, and the actual fund selected.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <SectionHeader
          eyebrow="Advisor workflow"
          title="Track, request, and talk to a real person when you’re ready"
          copy="Use SangroCars Wealth for real NAV tracking today, and use the request flow whenever you want to start a SIP, request a withdrawal, or talk through a goal-based plan."
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          {[
            { title: "Track Fund", copy: "Save a scheme into your watchlist and keep its NAV and return windows visible." },
            { title: "Start SIP", copy: "Raise a SIP support request with your target amount and timeline." },
            { title: "Compare", copy: "Stack multiple schemes side by side using live-style NAV snapshots." },
            { title: "Talk to Advisor", copy: "Connect with SangroCars Wealth for practical assistance and next steps." },
          ].map((item) => (
            <div key={item.title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.05)] sm:p-8">
            <SectionHeader
              eyebrow="Frequently asked"
              title="Common questions before you start"
              copy="We keep the product clean and simple today, while preparing it for richer portfolio management later."
            />
            <div className="mt-8 space-y-3">
              {faqs.map((faq, index) => (
                <div key={faq.question} className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/60">
                  <button
                    type="button"
                    onClick={() => setActiveFaq((current) => (current === index ? -1 : index))}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-semibold text-slate-950">{faq.question}</span>
                    <span className="text-xl text-slate-400">{activeFaq === index ? "−" : "+"}</span>
                  </button>
                  {activeFaq === index && <div className="border-t border-slate-200 px-5 py-4 text-sm leading-7 text-slate-600">{faq.answer}</div>}
                </div>
              ))}
            </div>
          </div>

          <ServiceLeadForm
            id="contact-advisor"
            serviceType="mutual_funds"
            title="Talk to a SangroCars Wealth advisor"
            description="Share your goal, SIP amount, or withdrawal need. We’ll follow up with the next practical step."
            submitLabel="Request callback"
            messagePlaceholder="Tell us which fund, SIP amount, or goal you want help with."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8 lg:pb-16">
        <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500 sm:px-6">
          Mutual fund NAV data is sourced from MFAPI / AMFI-linked daily updates. Transactions are not executed here. SangroCars Wealth currently supports tracking and service requests only.
        </div>
      </section>
    </main>
  );
}
