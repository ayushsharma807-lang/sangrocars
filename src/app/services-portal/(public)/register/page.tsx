import Link from "next/link";

export default async function ServicesPortalRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-md">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          SangroCars Services
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Create customer account
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This dashboard is for tracking and service requests only. All mutual fund transactions are executed through official platforms.
        </p>

        {params.error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error === "exists"
              ? "That email already exists."
              : "We could not create your account right now."}
          </div>
        ) : null}

        <form
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          method="post"
          action="/api/services/register"
        >
          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input
              name="name"
              required
              placeholder="Your full name"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Phone
            <input
              name="phone"
              placeholder="9876543210"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Email
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Password
            <input
              name="password"
              type="password"
              required
              placeholder="Create a password"
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />
          </label>
          <button className="mt-6 w-full rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white">
            Create account
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
          <Link href="/services-portal/login" className="font-medium text-slate-900">
            Already have an account?
          </Link>
          <Link href="/" className="hover:text-slate-900">
            Back to website
          </Link>
        </div>
      </div>
    </main>
  );
}
