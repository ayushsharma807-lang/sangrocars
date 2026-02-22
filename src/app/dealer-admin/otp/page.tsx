import Link from "next/link";

const errorText: Record<string, string> = {
  missing_fields: "Please enter both phone number and OTP code.",
  invalid_code: "Invalid OTP code. Please try again.",
  dealer_not_found: "Dealer account not found for this phone.",
  session_missing: "Could not create login session. Try again.",
  config: "OTP auth is not configured in Supabase.",
};

export default async function DealerOtpPage({
  searchParams,
}: {
  searchParams: Promise<{
    phone?: string;
    mode?: string;
    name?: string;
    city?: string;
    next?: string;
    status?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;
  const phone = params.phone ?? "";
  const mode = params.mode === "signup" ? "signup" : "login";
  const nextPath = params.next || "/dealer-admin";
  const hasConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  return (
    <main className="simple-page">
      <section className="simple-shell simple-auth">
        <div className="simple-header">
          <div>
            <h1>Verify OTP</h1>
            <p>Enter the code sent to your phone.</p>
          </div>
          <Link className="simple-link" href={mode === "signup" ? "/dealer-admin/signup" : "/dealer-admin/login"}>
            Back
          </Link>
        </div>

        {!hasConfig && (
          <div className="simple-alert simple-alert--error">
            Supabase OTP config missing.
          </div>
        )}
        {params.status === "sent" && (
          <div className="simple-alert">OTP sent to {phone}. Check your SMS.</div>
        )}
        {params.error && (
          <div className="simple-alert simple-alert--error">
            {errorText[params.error] ?? "Verification failed. Please try again."}
          </div>
        )}

        <form className="simple-form" method="post" action="/api/dealer/otp/verify">
          <input type="hidden" name="mode" value={mode} />
          <input type="hidden" name="next" value={nextPath} />
          <input type="hidden" name="name" value={params.name ?? ""} />
          <input type="hidden" name="city" value={params.city ?? ""} />
          <label>
            Phone
            <input name="phone" defaultValue={phone} required />
          </label>
          <label>
            OTP code
            <input
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6 digit OTP"
              required
            />
          </label>
          <button className="simple-button" type="submit">
            Verify & continue
          </button>
        </form>
      </section>
    </main>
  );
}
