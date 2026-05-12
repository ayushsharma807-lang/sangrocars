"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";

type FundCard = {
  name: string;
  risk: "Moderate" | "High";
  return1Y: string;
  nav: string;
  aum: string;
  points: number[];
};

const topFunds: FundCard[] = [
  {
    name: "Parag Parikh Flexi Cap",
    risk: "Moderate",
    return1Y: "22.6%",
    nav: "₹71.84",
    aum: "₹86,412 Cr",
    points: [32, 36, 35, 41, 46, 51, 57],
  },
  {
    name: "Nippon India Small Cap",
    risk: "High",
    return1Y: "31.4%",
    nav: "₹151.28",
    aum: "₹63,980 Cr",
    points: [28, 31, 34, 39, 48, 54, 61],
  },
  {
    name: "HDFC Flexi Cap",
    risk: "Moderate",
    return1Y: "19.7%",
    nav: "₹1,352.90",
    aum: "₹64,201 Cr",
    points: [40, 42, 43, 47, 49, 55, 58],
  },
  {
    name: "SBI Contra",
    risk: "High",
    return1Y: "27.9%",
    nav: "₹389.44",
    aum: "₹41,908 Cr",
    points: [25, 29, 33, 37, 43, 47, 53],
  },
];

const recentInvestments = [
  { fund: "Parag Parikh Flexi Cap", amount: "₹8,000 SIP", time: "Today • 10:30 AM" },
  { fund: "HDFC Flexi Cap", amount: "₹5,000 SIP", time: "Yesterday • 7:05 PM" },
  { fund: "Nippon India Small Cap", amount: "₹12,000 lump sum", time: "2 days ago" },
];

const faqs = [
  {
    question: "What is SIP?",
    answer:
      "A SIP lets you invest a fixed amount regularly into mutual funds, helping build discipline and reduce timing risk.",
  },
  {
    question: "How do mutual funds work?",
    answer:
      "Your money is pooled with other investors and managed by professionals who invest across equity, debt, or hybrid assets.",
  },
  {
    question: "Is SIP safe?",
    answer:
      "SIPs reduce volatility impact over time, but mutual funds still carry market risk. The right fund depends on your goal and horizon.",
  },
  {
    question: "How do I start investing?",
    answer:
      "Create your account, complete KYC later when enabled, choose a goal, compare funds, and start a SIP through SangroCars Wealth.",
  },
];

const stats = [
  { label: "Funds tracked", value: "120+" },
  { label: "Average SIP", value: "₹6,800" },
  { label: "Research watchlists", value: "4 live lists" },
  { label: "Goal templates", value: "18" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

function polyline(points: number[]) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - ((point - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function MutualFundsPage() {
  const [monthlyInvestment, setMonthlyInvestment] = useState("10000");
  const [years, setYears] = useState("10");
  const [expectedReturn, setExpectedReturn] = useState("12");
  const [activeFaq, setActiveFaq] = useState(0);

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
    return {
      invested,
      futureValue,
      returns,
    };
  }, [expectedReturn, monthlyInvestment, years]);

  return (
    <main className="min-h-screen scroll-smooth bg-white text-slate-950">
      <div className="bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.12),transparent_34%),linear-gradient(180deg,#f8fffb_0%,#ffffff_35%)]">
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
              <a href="#mutual-funds-top" className="transition hover:text-emerald-600">Mutual Funds</a>
              <a href="#sip-calculator" className="transition hover:text-emerald-600">SIP Calculator</a>
              <a href="#explore-funds" className="transition hover:text-emerald-600">Explore Funds</a>
              <Link href="/services-portal/login" className="transition hover:text-emerald-600">Login</Link>
              <Link
                href="/services-portal/register"
                className="rounded-full bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-2 text-white shadow-[0_10px_30px_rgba(34,197,94,0.22)] transition hover:scale-[1.01]"
              >
                Sign up
              </Link>
            </nav>

            <div className="flex items-center gap-2 lg:hidden">
              <Link
                href="/services-portal/login"
                className="rounded-full border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700"
              >
                Login
              </Link>
              <Link
                href="/services-portal/register"
                className="rounded-full bg-gradient-to-r from-emerald-600 to-green-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Sign up
              </Link>
            </div>
          </div>
        </header>

        <section id="mutual-funds-top" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                SangroCars Wealth
              </span>
              <h1 className="mt-6 max-w-2xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                Build wealth, SIP by SIP.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                Invest in mutual funds with SangroCars Wealth. Discover funds, plan SIPs, preview
                portfolio growth, and get ready for a real investment experience.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/services-portal/register"
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
              <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial="hidden"
                    animate="visible"
                    variants={fadeUp}
                    transition={{ duration: 0.45, delay: index * 0.06 }}
                    className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                      {stat.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute -left-6 top-10 hidden h-24 w-24 rounded-full bg-emerald-100 blur-3xl md:block" />
              <div className="absolute -right-2 bottom-4 hidden h-28 w-28 rounded-full bg-green-100 blur-3xl md:block" />
              <div className="relative rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_26px_70px_rgba(15,23,42,0.08)] sm:p-6">
                <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Portfolio growth</p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-tight">₹12.84 L</h2>
                      </div>
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                        +18.5%
                      </span>
                    </div>
                    <svg viewBox="0 0 100 50" className="mt-6 h-40 w-full">
                      <defs>
                        <linearGradient id="wealth-line" x1="0%" x2="100%" y1="0%" y2="0%">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,42 C10,39 17,34 25,32 C33,30 39,20 47,22 C55,24 60,18 68,15 C76,12 86,9 100,5"
                        fill="none"
                        stroke="url(#wealth-line)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-white/60">Invested</p>
                        <p className="mt-1 font-semibold text-white">₹9.90 L</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-white/60">Returns</p>
                        <p className="mt-1 font-semibold text-emerald-300">₹2.94 L</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3">
                        <p className="text-white/60">XIRR</p>
                        <p className="mt-1 font-semibold text-white">15.2%</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Laptop dashboard</p>
                      <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <span>Asset allocation</span>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Balanced
                          </span>
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                          <div className="relative h-24 w-24 rounded-full bg-[conic-gradient(#22c55e_0_52%,#86efac_52%_76%,#d1fae5_76%_100%)]">
                            <div className="absolute inset-4 rounded-full bg-white" />
                          </div>
                          <div className="space-y-2 text-sm text-slate-600">
                            <p><span className="font-semibold text-slate-950">52%</span> Equity</p>
                            <p><span className="font-semibold text-slate-950">24%</span> Hybrid</p>
                            <p><span className="font-semibold text-slate-950">24%</span> Debt</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.05)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Mobile app mockup</p>
                      <div className="mt-4 rounded-[26px] border border-slate-200 bg-slate-950 p-4 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-white/60">Today’s gain</p>
                            <p className="mt-1 text-xl font-semibold text-emerald-300">+₹4,820</p>
                          </div>
                          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                            Market stable
                          </span>
                        </div>
                        <div className="mt-5 grid gap-2">
                          {["Retirement SIP", "Child Education", "Wealth Builder"].map((goal) => (
                            <div
                              key={goal}
                              className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-sm"
                            >
                              <span>{goal}</span>
                              <span className="text-white/70">On track</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <section id="sip-calculator" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.article
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              SIP Calculator
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Estimate your future wealth
            </h2>
            <div className="mt-6 grid gap-4">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Monthly investment</span>
                <input
                  value={monthlyInvestment}
                  onChange={(event) => setMonthlyInvestment(event.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-emerald-500"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Years</span>
                  <input
                    value={years}
                    onChange={(event) => setYears(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Expected return %</span>
                  <input
                    value={expectedReturn}
                    onChange={(event) => setExpectedReturn(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-emerald-500"
                  />
                </label>
              </div>
            </div>
          </motion.article>

          <motion.article
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ delay: 0.08 }}
            className="rounded-[32px] border border-emerald-100 bg-[linear-gradient(180deg,#f7fff9_0%,#ffffff_100%)] p-6 shadow-[0_22px_50px_rgba(34,197,94,0.10)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Wealth Preview
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-white bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total invested</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {formatMoney(calculator.invested)}
                </p>
              </div>
              <div className="rounded-[24px] border border-white bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estimated returns</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-emerald-700">
                  {formatMoney(calculator.returns)}
                </p>
              </div>
              <div className="rounded-[24px] border border-white bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Wealth gained</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {formatMoney(calculator.futureValue)}
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-[28px] border border-white bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Projected growth</p>
                  <p className="mt-1 text-sm text-slate-500">Illustrative SIP compounding curve</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Monthly compounding
                </span>
              </div>
              <svg viewBox="0 0 100 40" className="mt-5 h-40 w-full">
                <defs>
                  <linearGradient id="sip-chart-fill" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(34,197,94,0.24)" />
                    <stop offset="100%" stopColor="rgba(34,197,94,0.02)" />
                  </linearGradient>
                </defs>
                <path d="M0,35 C12,34 18,31 28,29 C42,25 47,18 58,15 C69,11 80,10 100,4" fill="none" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M0,35 C12,34 18,31 28,29 C42,25 47,18 58,15 C69,11 80,10 100,4 L100,40 L0,40 Z" fill="url(#sip-chart-fill)" />
              </svg>
            </div>
          </motion.article>
        </div>
      </section>

      <section id="explore-funds" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Explore Funds
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Top mutual funds to start with
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Curated starter list with simplified risk labels and return snapshots.
            </p>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
            Search, compare, and prepare to track real funds here later.
          </div>
        </motion.div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
          {topFunds.map((fund, index) => (
            <motion.article
              key={fund.name}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={fadeUp}
              transition={{ delay: index * 0.05 }}
              className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    fund.risk === "High"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {fund.risk} Risk
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  1Y {fund.return1Y}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-semibold tracking-tight text-slate-950">
                {fund.name}
              </h3>
              <p className="mt-2 text-sm text-slate-500">AUM {fund.aum}</p>
              <svg viewBox="0 0 100 40" className="mt-6 h-28 w-full">
                <path
                  d={`M ${polyline(fund.points)}`}
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">NAV</p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
                    {fund.nav}
                  </p>
                </div>
                <button className="rounded-full bg-gradient-to-r from-emerald-600 to-green-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(34,197,94,0.2)] transition hover:-translate-y-0.5">
                  Start SIP
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <motion.article
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)]"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                  Portfolio Preview
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                  Your portfolio dashboard
                </h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Demo portfolio
              </span>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Total value</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">₹11.85 L</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Profit / loss</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-emerald-700">+₹1.85 L</p>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">XIRR</p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">14.2%</p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">Growth chart</p>
                  <span className="text-xs text-slate-500">Last 12 months</span>
                </div>
                <svg viewBox="0 0 100 48" className="mt-4 h-44 w-full">
                  <defs>
                    <linearGradient id="portfolio-fill" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(34,197,94,0.18)" />
                      <stop offset="100%" stopColor="rgba(34,197,94,0.02)" />
                    </linearGradient>
                  </defs>
                  <path d="M0,40 C10,38 14,34 22,31 C30,28 34,29 42,24 C52,18 57,22 66,16 C78,8 88,12 100,4" fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M0,40 C10,38 14,34 22,31 C30,28 34,29 42,24 C52,18 57,22 66,16 C78,8 88,12 100,4 L100,48 L0,48 Z" fill="url(#portfolio-fill)" />
                </svg>
              </div>
              <div className="rounded-[28px] border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">Asset allocation</p>
                  <span className="text-xs text-slate-500">4 funds</span>
                </div>
                <div className="mt-5 flex items-center gap-5">
                  <div className="relative h-28 w-28 rounded-full bg-[conic-gradient(#16a34a_0_38%,#22c55e_38%_67%,#86efac_67%_84%,#d1fae5_84%_100%)]">
                    <div className="absolute inset-5 rounded-full bg-white" />
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-950">38%</span> Flexi Cap</p>
                    <p><span className="font-semibold text-slate-950">29%</span> Large Cap</p>
                    <p><span className="font-semibold text-slate-950">17%</span> Small Cap</p>
                    <p><span className="font-semibold text-slate-950">16%</span> Contra</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-950">Recent investments</p>
                <span className="text-xs text-slate-500">Auto-synced later</span>
              </div>
              <div className="mt-4 space-y-3">
                {recentInvestments.map((investment) => (
                  <div
                    key={investment.fund}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-950">{investment.fund}</p>
                      <p className="mt-1 text-sm text-slate-500">{investment.time}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700">{investment.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.article>

          <motion.article
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            transition={{ delay: 0.08 }}
            className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_22px_50px_rgba(15,23,42,0.14)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
              Why Invest With SangroCars
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              A calmer, smarter way to build long-term wealth
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Smart SIP planning",
                  text: "Plan frequency, amount and duration around realistic savings behaviour.",
                },
                {
                  title: "Goal-based investing",
                  text: "Create dedicated journeys for emergency, education, retirement and wealth goals.",
                },
                {
                  title: "Long-term wealth creation",
                  text: "Track allocation, compounding and consistency instead of chasing noise.",
                },
                {
                  title: "Future AI recommendations",
                  text: "Prepare for guided fund suggestions and portfolio intelligence later.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-[26px] border border-white/10 bg-white/5 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M6 12h12" strokeLinecap="round" />
                      <path d="M12 6v12" strokeLinecap="round" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.article>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={fadeUp}
          className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
        >
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">FAQ</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Mutual fund basics, simplified
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Clear answers for first-time investors and SIP starters.
              </p>
            </div>
            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const open = activeFaq === index;
                return (
                  <button
                    key={faq.question}
                    type="button"
                    onClick={() => setActiveFaq(index)}
                    className="w-full rounded-[24px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-base font-semibold text-slate-950">{faq.question}</h3>
                      <span className="text-lg font-semibold text-emerald-600">{open ? "−" : "+"}</span>
                    </div>
                    {open ? (
                      <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-slate-600 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="font-medium text-slate-950">SangroCars Wealth</div>
          <div className="flex flex-wrap gap-4">
            <Link href="/about" className="transition hover:text-emerald-700">About</Link>
            <Link href="/contact" className="transition hover:text-emerald-700">Contact</Link>
            <Link href="/privacy" className="transition hover:text-emerald-700">Privacy</Link>
            <Link href="/terms" className="transition hover:text-emerald-700">Terms</Link>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-8 text-xs leading-6 text-slate-500 sm:px-6 lg:px-8">
          This mutual funds experience is a frontend preview only. Live NAV APIs, SIP tracking,
          KYC, payment flows and real investing workflows will be integrated later.
        </div>
      </footer>
    </main>
  );
}
