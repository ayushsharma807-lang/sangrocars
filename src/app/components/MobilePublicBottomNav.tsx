"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const visiblePaths = new Set(["/", "/cars", "/listings"]);

const navItems = [
  { label: "Home", href: "/", icon: "⌂" },
  { label: "Cars", href: "/listings", icon: "▰" },
  { label: "Wealth", href: "/mutual-funds", icon: "◌" },
  { label: "Finance", href: "/finance", icon: "₹" },
  { label: "Insurance", href: "/insurance", icon: "◇" },
];

export default function MobilePublicBottomNav() {
  const pathname = usePathname();

  if (!visiblePaths.has(pathname)) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 shadow-[0_-16px_40px_rgba(15,23,42,0.10)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || (item.href === "/listings" && pathname === "/cars");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-12 flex-col items-center justify-center rounded-2xl px-1 text-[11px] font-bold transition ${
                active ? "bg-slate-950 text-white" : "text-slate-500 active:bg-slate-100"
              }`}
            >
              <span className="text-base leading-4">{item.icon}</span>
              <span className="mt-1 leading-3">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
