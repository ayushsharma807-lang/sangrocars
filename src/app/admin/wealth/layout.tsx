import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/admin/wealth", label: "Overview" },
  { href: "/admin/wealth/leads", label: "Leads" },
  { href: "/admin/wealth/customers", label: "Customers" },
  { href: "/admin/wealth/investments", label: "Investments" },
  { href: "/admin/wealth/activity", label: "Activity" },
];

export default async function WealthAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect(`/admin/login?next=${encodeURIComponent("/admin/wealth")}`);
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/admin/wealth" className="flex items-center gap-3">
              <img
                src="/images/sangrocars-logo.png"
                alt="Sangro"
                className="h-11 w-11 rounded-2xl border border-slate-200 object-contain p-1"
              />
              <div>
                <div className="text-lg font-semibold">Sangro Wealth Admin</div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Mutual funds operations
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/leads"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:border-slate-950"
              >
                Main Admin
              </Link>
              <Link
                href="/"
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Website
              </Link>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </main>
  );
}
