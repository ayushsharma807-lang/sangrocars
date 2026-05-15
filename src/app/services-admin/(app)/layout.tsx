import Link from "next/link";
import { requirePortalRole } from "@/lib/servicesPortalAuth";

const navItems = [
  { href: "/services-admin", label: "Dashboard" },
  { href: "/services-admin/customers", label: "Customers" },
  { href: "/services-admin/mutual-funds", label: "Mutual Funds" },
  { href: "/services-admin/requests", label: "Requests" },
  { href: "/services-admin/insurance", label: "Insurance" },
  { href: "/services-admin/loans", label: "Loans" },
];

export default async function ServicesAdminAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePortalRole("admin", "/services-admin/login");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
              Sangro Services
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              Admin · {session.profile.name}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <form action="/api/services/logout" method="post">
              <input type="hidden" name="next" value="/services-admin/login" />
              <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 text-xs font-semibold text-slate-600">
          {navItems.map((item) => (
            <Link
              key={item.href}
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
