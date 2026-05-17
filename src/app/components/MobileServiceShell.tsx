"use client";

import Link from "next/link";

type ServiceKind = "wealth" | "finance" | "insurance";

type Props = {
  service: ServiceKind;
  ctaLabel: string;
  ctaHref: string;
};

const serviceLabels: Record<ServiceKind, string> = {
  wealth: "Wealth",
  finance: "Finance",
  insurance: "Insurance",
};

const navItems = [
  { label: "Home", href: "/", icon: "⌂" },
  { label: "Wealth", href: "/mutual-funds", icon: "◌" },
  { label: "Finance", href: "/finance", icon: "₹" },
  { label: "Insurance", href: "/insurance", icon: "◇" },
  { label: "Cars", href: "/listings", icon: "▰" },
];

export default function MobileServiceShell({
  service,
  ctaLabel,
  ctaHref,
}: Props) {
  const label = serviceLabels[service];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <img
              src="/images/sangrocars-logo.png"
              alt="Sangro"
              className="h-9 w-9 rounded-xl border border-slate-200 object-contain p-1"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-black leading-4 text-slate-950">
                Sangro
              </p>
              <p className="truncate text-xs font-semibold text-slate-500">
                {label}
              </p>
            </div>
          </Link>
          <button
            type="button"
            aria-label="Open service menu"
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-lg font-black text-slate-950"
          >
            ⋯
          </button>
        </div>
      </header>

      <div className="fixed inset-x-0 bottom-[72px] z-40 px-4 md:hidden">
        <a
          href={ctaHref}
          className="mx-auto flex h-12 max-w-md items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-[0_18px_45px_rgba(15,23,42,0.26)] active:scale-[0.99]"
        >
          {ctaLabel}
        </a>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-16px_40px_rgba(15,23,42,0.10)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navItems.map((item) => {
            const active =
              item.href ===
              (service === "wealth"
                ? "/mutual-funds"
                : service === "finance"
                ? "/finance"
                : "/insurance");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-12 flex-col items-center justify-center rounded-2xl px-1 text-[11px] font-bold transition ${
                  active
                    ? "bg-slate-950 text-white"
                    : "text-slate-500 active:bg-slate-100"
                }`}
              >
                <span className="text-base leading-4">{item.icon}</span>
                <span className="mt-1 leading-3">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
