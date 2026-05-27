import Link from "next/link";

export default async function WealthLoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    magic_sent?: string;
    registered?: string;
    next?: string;
  }>;
}) {
  const params = await searchParams;
  const nextPath = params.next || "/wealth/dashboard";
  const forgotPasswordMessage = encodeURIComponent(
    "Hi Sangro Wealth, I need help resetting my portfolio login password."
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),transparent_32%),#ffffff] px-4 py-6 text-slate-950 sm:py-8">
      <section className="mx-auto grid min-h-[86vh] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <Link
            href="/mutual-funds"
            className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-[0_12px_35px_rgba(15,23,42,0.06)]"
          >
            <img
              src="/images/sangrocars-logo.png"
              alt="Sangro"
              className="h-11 w-11 rounded-2xl border border-slate-200 object-contain p-1"
            />
            <div>
              <p className="text-lg font-semibold">Sangro Wealth</p>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Investor login
              </p>
            </div>
          </Link>
          <h1 className="mt-8 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Track your mutual fund portfolio.
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
            View investments entered by Sangro Wealth, latest NAV value,
            profit/loss and transaction history.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {["Daily NAV tracking", "Private dashboard", "Manual advisor support"].map(
              (item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm font-semibold text-emerald-900"
                >
                  {item}
                </div>
              )
            )}
          </div>
        </div>

        <div className="rounded-[34px] border border-slate-200 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.1)] sm:p-6">
          <div className="rounded-[28px] border border-slate-100 bg-gradient-to-br from-emerald-50 to-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              Customer access
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Login to dashboard</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use the email/phone and password created for your Sangro Wealth
              customer account.
            </p>
          </div>

          {params.registered && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
              Account created. Please login.
            </div>
          )}
          {params.magic_sent && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
              Magic link sent. Open your email to continue to the dashboard.
            </div>
          )}
          {params.error && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              Login failed. Check your email/phone and password, or ask Sangro
              Wealth to activate your customer account.
            </div>
          )}

          <form action="/api/services/login" method="post" className="mt-5">
            <input type="hidden" name="role" value="customer" />
            <input type="hidden" name="next" value={nextPath} />
            <label className="block text-sm font-semibold">
              Email or phone
              <input
                name="identifier"
                required
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-emerald-500"
                placeholder="you@gmail.com or 9876543210"
              />
            </label>
            <label className="mt-4 block text-sm font-semibold">
              Password
              <input
                name="password"
                type="password"
                required
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-emerald-500"
                placeholder="Your password"
              />
            </label>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <a
                href={`https://wa.me/919041322997?text=${forgotPasswordMessage}`}
                className="font-semibold text-slate-500 transition hover:text-emerald-700"
              >
                Forgot password?
              </a>
              <Link
                href="/mutual-funds/onboarding"
                className="font-semibold text-emerald-700"
              >
                Sign up
              </Link>
            </div>
            <button
              className="mt-6 min-h-12 w-full rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white shadow-[0_14px_35px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700"
              type="submit"
            >
              Open dashboard
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form action="/api/wealth/magic-link" method="post" className="space-y-3">
            <input type="hidden" name="next" value={nextPath} />
            <label className="block text-sm font-semibold">
              Send magic link
              <input
                name="identifier"
                required
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-emerald-500"
                placeholder="Enter your registered email or phone"
              />
            </label>
            <button
              type="submit"
              className="min-h-12 w-full rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-950 transition hover:border-emerald-300 hover:bg-emerald-50"
            >
              Email me a login link
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Need a real customer login?{" "}
            <Link href="/wealth/signup" className="font-semibold text-emerald-700">
              Create customer account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
