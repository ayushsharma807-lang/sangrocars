import Link from "next/link";

export default async function WealthLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string; next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next || "/wealth/dashboard";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),transparent_30%),#ffffff] px-4 py-8 text-slate-950">
      <section className="mx-auto grid min-h-[80vh] max-w-5xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Link href="/mutual-funds" className="inline-flex items-center gap-3">
            <img src="/images/sangrocars-logo.png" alt="SangroCars" className="h-12 w-12 rounded-2xl border border-slate-200 object-contain p-1" />
            <div>
              <p className="text-lg font-semibold">SangroCars Wealth</p>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Investor login</p>
            </div>
          </Link>
          <h1 className="mt-8 text-4xl font-semibold tracking-tight sm:text-5xl">
            Track your mutual fund portfolio.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
            View investments entered by SangroCars Wealth, latest NAV value,
            profit/loss and transaction history.
          </p>
        </div>

        <form action="/api/services/login" method="post" className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <input type="hidden" name="role" value="customer" />
          <input type="hidden" name="next" value={nextPath} />
          <h2 className="text-2xl font-semibold">Login</h2>
          {params.registered && <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Account created. Please login.</div>}
          {params.error && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">Login failed. Check email/phone and password.</div>}
          <label className="mt-5 block text-sm font-semibold">
            Email or phone
            <input name="identifier" required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="you@gmail.com or 9876543210" />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Password
            <input name="password" type="password" required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Your password" />
          </label>
          <button className="mt-6 w-full rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700" type="submit">
            Open dashboard
          </button>
          <p className="mt-5 text-center text-sm text-slate-500">
            New customer?{" "}
            <Link href="/wealth/signup" className="font-semibold text-emerald-700">
              Create account
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
