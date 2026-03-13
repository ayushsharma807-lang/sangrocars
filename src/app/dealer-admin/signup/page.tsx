export const dynamic = "force-dynamic";

import Link from "next/link";

export default async function DealerSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next || "/dealer-admin/profile";
  const hasConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  return (
    <main className="simple-page">
      <section className="simple-shell simple-auth">
        <div className="simple-header">
          <div>
            <h1>Dealer signup</h1>
            <p>Create your dealer account with email and password, then start posting cars.</p>
          </div>
          <Link className="simple-link" href="/">
            Back to home
          </Link>
        </div>
        {!hasConfig && (
          <div className="simple-alert simple-alert--error">
            Signup is not configured. Add Supabase environment keys first.
          </div>
        )}
        {params.error && (
          <div className="simple-alert simple-alert--error">
            {params.error === "config"
              ? "Signup configuration is missing."
              : params.error === "invalid_input"
                ? "Please fill all required fields correctly."
                : params.error === "profile_setup"
                  ? "Account created, but dealer profile setup failed. Please contact support."
                  : params.error === "email_exists"
                    ? "This email is already registered. Try signing in instead."
                    : "Signup failed. Please try again."}
          </div>
        )}
        <form className="simple-form" method="post" action="/api/dealer/signup">
          <input type="hidden" name="next" value={nextPath} />
          <div className="simple-form__grid">
            <label>
              Email
              <input
                name="email"
                type="email"
                placeholder="dealer@company.com"
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
              />
            </label>
          </div>
          <button className="simple-button" type="submit">
            Create account
          </button>
          <p className="simple-form__helper">
            Already have an account? <Link href="/dealer-admin/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
