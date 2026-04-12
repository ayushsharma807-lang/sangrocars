import Link from "next/link";

export default async function AdminAppLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next || "/admin-app";
  const hasConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          SangroCars Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use your approved admin account to manage listings and leads.
        </p>
      </div>
      {!hasConfig && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </div>
      )}
      {params.error && (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Invalid credentials or access denied. Please try again.
        </div>
      )}
      <form
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        method="post"
        action="/api/admin/login"
      >
        <input type="hidden" name="next" value={nextPath} />
        <label className="text-sm font-medium text-slate-700">
          Email
          <input
            name="email"
            type="email"
            placeholder="admin@sangrocars.in"
            required
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </label>
        <label className="mt-4 block text-sm font-medium text-slate-700">
          Password
          <input
            name="password"
            type="password"
            placeholder="Your Supabase password"
            required
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
        </label>
        <button
          className="mt-6 w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white"
          type="submit"
        >
          Sign in
        </button>
      </form>
      <Link className="mt-6 text-center text-sm text-slate-500" href="/">
        Back to website
      </Link>
    </main>
  );
}
