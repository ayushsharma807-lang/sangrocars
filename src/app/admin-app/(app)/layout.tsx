"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin-app", label: "Dashboard" },
  { href: "/admin-app/listings", label: "Listings" },
  { href: "/admin-app/listings/new", label: "Add" },
  { href: "/admin-app/leads", label: "Leads" },
];

export default function AdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              SangroCars
            </p>
            <h1 className="text-lg font-semibold text-slate-900">Admin</h1>
          </div>
          <form method="post" action="/api/admin/logout">
            <button className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-xs font-semibold ${
                  active ? "bg-black text-white" : "text-slate-600"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
