import "../globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export default function LeadManagerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Sangro Cars
            </p>
            <h1 className="text-lg font-semibold text-slate-900">
              Lead Manager
            </h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link className="rounded-full border border-slate-200 px-3 py-1.5" href="/lead-manager">
              Dashboard
            </Link>
            <Link className="rounded-full border border-slate-200 px-3 py-1.5" href="/lead-manager/leads">
              Leads
            </Link>
            <Link className="rounded-full border border-slate-200 px-3 py-1.5" href="/lead-manager/new">
              Add Lead
            </Link>
            <form action="/api/lead-manager/logout" method="post">
              <button className="rounded-full border border-slate-200 px-3 py-1.5" type="submit">
                Logout
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
