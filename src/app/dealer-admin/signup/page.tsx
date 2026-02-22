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
  const otpErrorText =
    params.error === "invalid_phone"
      ? "Please enter a valid phone number."
      : params.error === "otp_send_failed"
        ? "Could not send OTP. Please try again."
        : params.error === "rate_limited"
          ? "Too many OTP requests. Please wait and retry."
          : null;

  return (
    <main className="simple-page">
      <section className="simple-shell simple-auth">
        <div className="simple-header">
          <div>
            <h1>Dealer signup</h1>
            <p>Create your dealer account and start posting cars.</p>
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
        {params.error &&
          !["invalid_phone", "otp_send_failed", "rate_limited"].includes(
            params.error
          ) && (
          <div className="simple-alert simple-alert--error">
            {params.error === "config"
              ? "Signup configuration is missing."
              : params.error === "invalid_input"
                ? "Please fill all required fields correctly."
                : params.error === "profile_setup"
                  ? "Account created, but dealer profile setup failed. Please contact support."
                  : "Signup failed. Try again with a different email."}
          </div>
        )}
        {otpErrorText && (
          <div className="simple-alert simple-alert--error">{otpErrorText}</div>
        )}
        <form className="simple-form" method="post" action="/api/dealer/otp/request">
          <input type="hidden" name="mode" value="signup" />
          <input type="hidden" name="next" value={nextPath} />
          <div className="simple-form__grid">
            <label>
              Dealer / showroom name
              <input
                name="name"
                placeholder="e.g., Sharma Cars"
                required
                minLength={2}
              />
            </label>
            <label>
              Phone (OTP)
              <input
                name="phone"
                type="tel"
                placeholder="e.g., 9876543210"
                required
              />
            </label>
            <label>
              City
              <input name="city" placeholder="e.g., Jalandhar" />
            </label>
          </div>
          <button className="simple-button" type="submit">
            Send OTP & create account
          </button>
        </form>
        <form className="simple-form" method="post" action="/api/dealer/signup">
          <input type="hidden" name="next" value={nextPath} />
          <div className="simple-form__grid">
            <label>
              Dealer / showroom name
              <input
                name="name"
                placeholder="e.g., Sharma Cars"
                required
                minLength={2}
              />
            </label>
            <label>
              Phone
              <input name="phone" placeholder="e.g., 9876543210" />
            </label>
            <label>
              City
              <input name="city" placeholder="e.g., Jalandhar" />
            </label>
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
