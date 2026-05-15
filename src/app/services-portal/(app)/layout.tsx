import Link from "next/link";
import { requirePortalRole } from "@/lib/servicesPortalAuth";

const navItems = [
  { href: "/services-portal", label: "Home" },
  { href: "/services-portal#mutual-funds", label: "Mutual Funds" },
  { href: "/services-portal#insurance", label: "Insurance" },
  { href: "/services-portal#loans", label: "Loans" },
  { href: "/services-portal#support", label: "Support" },
];

export default async function ServicesPortalAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePortalRole("customer", "/services-portal/login");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Sangro Services
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              Welcome, {session.profile.name}
            </h1>
          </div>
          <form action="/api/services/logout" method="post">
            <input type="hidden" name="next" value="/services-portal/login" />
            <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 overflow-x-auto px-4 py-3 text-xs font-semibold text-slate-600">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-slate-200 px-4 py-2"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
