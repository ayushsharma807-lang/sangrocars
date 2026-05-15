import Link from "next/link";

export default async function ServicesPortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          Sangro Services
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Customer login
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Track mutual funds, insurance, loans, and raise service requests in one place.
        </p>

        {params.registered ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Account created. Please sign in.
          </div>
        ) : null}
        {params.error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error === "role"
              ? "This account is not set up as a customer."
              : params.error === "config"
                ? "Supabase auth is not configured yet."
                : "Invalid login. Use your email or phone number and password."}
          </div>
        ) : null}

        <form
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          method="post"
          action="/api/services/login"
        >
          <input type="hidden" name="role" value="customer" />
          <input type="hidden" name="next" value="/services-portal" />
          <label className="block text-sm font-medium text-slate-700">
            Email or phone
            <input
              name="identifier"
              required
              placeholder="you@example.com or 9876543210"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Password
            <input
              name="password"
              type="password"
              required
              placeholder="Your password"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </label>
          <button className="mt-6 w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white">
            Sign in
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
          <Link href="/services-portal/register" className="font-medium text-slate-900">
            Create customer account
          </Link>
          <Link href="/" className="hover:text-slate-900">
            Back to website
          </Link>
        </div>
      </div>
    </main>
  );
}
