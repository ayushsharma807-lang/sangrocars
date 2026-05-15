import Link from "next/link";

export default async function WealthSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-3xl">
        <Link href="/mutual-funds" className="inline-flex items-center gap-3">
          <img src="/images/sangrocars-logo.png" alt="Sangro" className="h-12 w-12 rounded-2xl border border-slate-200 object-contain p-1" />
          <div>
            <p className="text-lg font-semibold">Sangro Wealth</p>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Customer signup</p>
          </div>
        </Link>

        <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <h1 className="text-4xl font-semibold tracking-tight">Create wealth account</h1>
          <p className="mt-3 text-slate-600">No email confirmation needed. Your dashboard opens after login.</p>
          {params.error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              Signup failed. Try a different email or check required fields.
            </div>
          )}

          <form action="/api/wealth/signup" method="post" className="mt-6 grid gap-4">
            <label className="text-sm font-semibold">
              Full name
              <input name="name" required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Ayush Sharma" />
            </label>
            <label className="text-sm font-semibold">
              Phone
              <input name="phone" required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="9041322997" />
            </label>
            <label className="text-sm font-semibold">
              Email
              <input name="email" type="email" required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="you@gmail.com" />
            </label>
            <label className="text-sm font-semibold">
              City
              <input name="city" className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Jalandhar" />
            </label>
            <label className="text-sm font-semibold">
              Password
              <input name="password" type="password" minLength={6} required className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Minimum 6 characters" />
            </label>
            <button className="mt-2 rounded-full bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700" type="submit">
              Create account
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
