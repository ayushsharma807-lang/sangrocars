"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: ReactNode;
};

type QuickStat = {
  label: string;
  value: string;
  tone?: "default" | "success" | "danger" | "accent";
};

type Props = {
  section: "mutual-funds" | "finance" | "insurance" | "properties";
  title: string;
  subtitle: string;
  statusLabel?: string;
  statusTone?: "default" | "success" | "danger" | "accent";
  quickStats?: QuickStat[];
  actions?: ReactNode;
  children: ReactNode;
};

const navItems: NavItem[] = [
  {
    href: "/mutual-funds",
    label: "Mutual Funds",
    shortLabel: "Funds",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 18h16" />
        <path d="M7 15l3-3 3 2 4-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/finance",
    label: "Finance",
    shortLabel: "Finance",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="6" width="16" height="12" rx="2.5" />
        <path d="M8 12h8M8 9.5h3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/insurance",
    label: "Insurance",
    shortLabel: "Insurance",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4l6 2.5V11c0 4.3-2.5 7.2-6 9-3.5-1.8-6-4.7-6-9V6.5L12 4z" />
        <path d="m9.5 12 1.7 1.8 3.3-3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/properties",
    label: "Properties",
    shortLabel: "Property",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4.5 10.5L12 4l7.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 9.5V20h11V9.5" strokeLinejoin="round" />
        <path d="M10 20v-5h4v5" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function toneClasses(tone: QuickStat["tone"] = "default") {
  switch (tone) {
    case "success":
      return "text-emerald-600";
    case "danger":
      return "text-rose-600";
    case "accent":
      return "text-sky-600";
    default:
      return "text-slate-950";
  }
}

function statusBadgeClasses(tone: Props["statusTone"] = "default") {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "danger":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "accent":
      return "border-sky-200 bg-sky-50 text-sky-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export default function ServicePlatformShell({
  section,
  title,
  subtitle,
  statusLabel,
  statusTone = "default",
  quickStats = [],
  actions,
  children,
}: Props) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-80 shrink-0 border-r border-slate-200 bg-white xl:flex xl:flex-col">
          <div className="border-b border-slate-200 px-6 py-6">
            <Link href="/" className="flex items-center gap-4 text-slate-950">
              <img
                src="/images/sangrocars-logo.png"
                alt="Sangro"
                className="h-12 w-12 rounded-2xl border border-slate-200 object-contain p-1"
              />
              <div>
                <div className="text-lg font-semibold tracking-tight">Sangro</div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Service Console
                </div>
              </div>
            </Link>
          </div>
          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const active = item.href.endsWith(section);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate-200 px-6 py-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Service mode
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Workflows, estimates, tracking and service requests only. Final execution happens through official platforms and manual verification.
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-24 xl:pb-0">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Sangro Services
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                  {statusLabel ? (
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClasses(statusTone)}`}>
                      {statusLabel}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">{actions}</div>
            </div>
          </header>

          <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {quickStats.length ? (
              <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
                {quickStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)]"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {stat.label}
                    </p>
                    <p className={`mt-3 text-xl font-semibold tracking-tight ${toneClasses(stat.tone)}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 xl:hidden">
              {navItems.map((item) => {
                const active = item.href.endsWith(section);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${
                      active
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {children}
          </section>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur xl:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-2">
          {navItems.map((item) => {
            const active = item.href.endsWith(section);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium ${
                  active ? "bg-slate-950 text-white" : "text-slate-600"
                }`}
              >
                {item.icon}
                <span>{item.shortLabel ?? item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
