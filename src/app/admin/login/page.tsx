import Link from "next/link";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const hasConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const requiredRoles = (process.env.ADMIN_REQUIRED_ROLES ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const nextPath = params.next || "/admin/leads";

  return (
    <main className="home">
      <section className="section admin auth">
        <div className="section__header">
          <div>
            <h2>Admin login</h2>
            <p>Enter the admin password to access the lead inbox.</p>
          </div>
          <Link className="btn btn--ghost" href="/">
            Back to home
          </Link>
        </div>
        {!hasConfig && (
          <div className="admin-banner">
            Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY to enable admin auth.
          </div>
        )}
        {allowedEmails.length > 0 && (
          <div className="admin-banner">
            Allowed emails: {allowedEmails.join(", ")}
          </div>
        )}
        {requiredRoles.length > 0 && (
          <div className="admin-banner">
            Required role: {requiredRoles.join(", ")}
          </div>
        )}
        {params.error && (
          <div className="admin-banner admin-banner--error">
            {params.error === "config"
              ? "Supabase is not configured correctly. Add real project URL and anon key in .env.local."
              : params.error === "unauthorized"
              ? "Access denied. This email is not allowed."
              : params.error === "unauthorized_role"
                ? "Access denied. This account is missing the required role."
                : "Invalid email or password. Try again."}
          </div>
        )}
        <form className="admin-form" method="post" action="/api/admin/login">
          <input type="hidden" name="next" value={nextPath} />
          <label>
            Email
            <input
              name="email"
              type="email"
              placeholder="admin@dealer.com"
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
          <button className="btn btn--solid" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
