import Link from "next/link";

export default async function DealerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; signup?: string }>;
}) {
  const params = await searchParams;
  const hasConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const requiredRoles = (process.env.DEALER_REQUIRED_ROLES ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedEmails = (process.env.DEALER_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const nextPath = params.next || "/dealer-admin";

  return (
    <main className="simple-page">
      <section className="simple-shell simple-auth">
        <div className="simple-header">
          <div>
            <h1>Dealer login</h1>
            <p>Sign in to manage your listings and profile.</p>
          </div>
          <Link className="simple-link" href="/">
            Back to home
          </Link>
        </div>
        {!hasConfig && (
          <div className="simple-alert">
            Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY to enable dealer auth.
          </div>
        )}
        {allowedEmails.length > 0 && (
          <div className="simple-alert">
            Allowed emails: {allowedEmails.join(", ")}
          </div>
        )}
        {requiredRoles.length > 0 && (
          <div className="simple-alert">
            Required role: {requiredRoles.join(", ")}
          </div>
        )}
        {params.error && (
          <div className="simple-alert simple-alert--error">
            {params.error === "unauthorized"
              ? "Access denied. This email is not allowed."
              : params.error === "unauthorized_role"
                ? "Access denied. This account is missing the required role."
                : params.error === "email_confirm"
                  ? "Email confirmation is enabled in Supabase. Disable it to allow instant dealer sign-up."
                  : params.error === "otp_disabled"
                    ? "OTP login is disabled. Please sign in with email and password."
                    : params.error === "dealer_not_found"
                      ? "No dealer record found for this account."
                      : "Invalid email or password. Try again."}
          </div>
        )}
        {params.signup === "check_email" && (
          <div className="simple-alert">
            Account created. You can sign in now.
          </div>
        )}
        <form className="simple-form" method="post" action="/api/dealer/login">
          <input type="hidden" name="next" value={nextPath} />
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
              placeholder="Supabase account password"
              required
            />
          </label>
          <button className="simple-button" type="submit">
            Sign in
          </button>
          <p className="simple-form__helper">
            New dealer? <Link href="/dealer-admin/signup">Create account</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
