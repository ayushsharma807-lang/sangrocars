import Link from "next/link";
import type { ReactNode } from "react";
import { fetchAmfiNavMap } from "@/lib/amfi";

type ServiceCard = {
  title: string;
  subtitle: string;
  href: string;
  stat: string;
  icon: ReactNode;
};

const services: ServiceCard[] = [
  {
    title: "Mutual Funds",
    subtitle: "Track NAV, SIPs and portfolio requests.",
    href: "/mutual-funds",
    stat: "126 funds tracked",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 18h16" />
        <path d="M7 15l3-3 3 2 4-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Finance Services",
    subtitle: "Check car loan eligibility and EMI.",
    href: "/finance",
    stat: "42 live applications",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="6" width="16" height="12" rx="2.5" />
        <path d="M8 12h8M8 9.5h3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Insurance",
    subtitle: "Estimate premium and renew policy.",
    href: "/insurance",
    stat: "184 renewals this month",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4l6 2.5V11c0 4.3-2.5 7.2-6 9-3.5-1.8-6-4.7-6-9V6.5L12 4z" />
        <path d="m9.5 12 1.7 1.8 3.3-3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Used Cars",
    subtitle: "Buy and sell verified used cars with Sangro Cars.",
    href: "/listings",
    stat: "318 active listings",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6.5 15.5 8.2 10h7.6l1.7 5.5" strokeLinejoin="round" />
        <path d="M5 15.5h14a1.5 1.5 0 0 1 1.5 1.5V18H19v1.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V18h-10v1.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V18H3.5v-1a1.5 1.5 0 0 1 1.5-1.5Z" strokeLinejoin="round" />
        <circle cx="8" cy="16.8" r="1" fill="currentColor" />
        <circle cx="16" cy="16.8" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Properties",
    subtitle: "Buy, sell and rent local properties.",
    href: "/properties",
    stat: "96 site visits scheduled",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4.5 10.5L12 4l7.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 9.5V20h11V9.5" strokeLinejoin="round" />
        <path d="M10 20v-5h4v5" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const previewFunds = [
  { title: "Parag Parikh Flexi Cap Fund", matcher: "parag parikh flexi cap fund", change: "+0.34%" },
  { title: "HDFC Balanced Advantage Fund", matcher: "hdfc balanced advantage fund", change: "-0.12%" },
  { title: "ICICI Prudential Bluechip Fund", matcher: "icici prudential bluechip fund", change: "+0.22%" },
];

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export default async function HomePage() {
  const navMap = await fetchAmfiNavMap().catch(() => new Map());
  const records = Array.from(navMap.values());
  const marketCards = previewFunds.map((fund) => {
    const match = records.find((record) => record.fundName.toLowerCase().includes(fund.matcher));
    return {
      ...fund,
      nav: match?.nav ?? 0,
      updated: match?.navDate ?? "Updated daily",
    };
  });

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-20 rounded-[28px] border border-slate-200 bg-white/90 px-5 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="flex items-center gap-4">
              <img src="/images/sangrocars-logo.png" alt="Sangro" className="h-12 w-12 rounded-2xl border border-slate-200 object-contain p-1" />
              <div>
                <div className="text-xl font-semibold tracking-tight">Sangro</div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Cars • Properties • Finance • Mutual Funds • Insurance</div>
              </div>
            </Link>
            <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-600">
              {services.map((service) => (
                <Link key={service.href} href={service.href} className="rounded-full border border-slate-200 px-4 py-2 transition hover:border-slate-950 hover:text-slate-950">
                  {service.title}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <section className="grid gap-6 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.08),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_32%),white] p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Service dashboard</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Sangro Services</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              One trusted place for cars, properties, finance, mutual funds and insurance — designed like a real operating dashboard, not a brochure.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Active users", value: "1.2k+" },
                { label: "Funds tracked", value: "126" },
                { label: "Insurance renewals", value: "184" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {marketCards.map((fund) => (
              <div key={fund.title} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{fund.title}</p>
                    <p className="mt-1 text-xs text-slate-500">Last NAV updated {fund.updated}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${fund.change.startsWith("-") ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>{fund.change}</span>
                </div>
                <div className="mt-5 flex items-end justify-between">
                  <strong className="text-2xl font-semibold tracking-tight">{fund.nav ? `₹${fund.nav.toFixed(2)}` : "NAV pending"}</strong>
                  <div className="h-14 w-24 rounded-2xl bg-[linear-gradient(135deg,rgba(15,23,42,0.08),rgba(15,23,42,0.02))]" />
                </div>
              </div>
            ))}
            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_14px_34px_rgba(15,23,42,0.16)] sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Live market preview</p>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Portfolio Preview</h2>
                  <p className="mt-1 text-sm text-white/70">Data powered by AMFI. Updated daily.</p>
                </div>
                <Link href="/mutual-funds" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950">Open tracker</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="group rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_12px_34px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_20px_50px_rgba(15,23,42,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white">{service.icon}</div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{service.stat}</span>
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight">{service.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{service.subtitle}</p>
              <div className="mt-6 flex items-center justify-between text-sm font-semibold text-slate-950">
                <span>View Service</span>
                <span className="transition group-hover:translate-x-1">→</span>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-4">
          {[
            { label: "Properties listed", value: "96", note: "Site visits booked this month" },
            { label: "Loan workflows", value: "42", note: "Eligibility checks in progress" },
            { label: "SIP requests", value: "28", note: "Awaiting advisor follow-up" },
            { label: "Policy renewals", value: "184", note: "Support queue across insurers" },
          ].map((item) => (
            <div key={item.label} className="rounded-[26px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight">{item.value}</p>
              <p className="mt-2 text-sm text-slate-600">{item.note}</p>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
