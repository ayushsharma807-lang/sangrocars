import Link from "next/link";

export default async function ServicesAdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col justify-center">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          SangroCars Services
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Admin login
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use your approved admin account to manage customer tracking and service requests.
        </p>

        {params.error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error === "role"
              ? "This account is not marked as admin."
              : "Invalid login or missing access."}
          </div>
        ) : null}

        <form
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          method="post"
          action="/api/services/login"
        >
          <input type="hidden" name="role" value="admin" />
          <input type="hidden" name="next" value="/services-admin" />
          <label className="block text-sm font-medium text-slate-700">
            Email or phone
            <input
              name="identifier"
              required
              placeholder="admin@sangrocars.in or 9876543210"
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

        <Link href="/" className="mt-5 text-sm text-slate-500 hover:text-slate-900">
          Back to website
        </Link>
      </div>
    </main>
  );
}
