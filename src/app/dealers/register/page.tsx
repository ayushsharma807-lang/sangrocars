import Link from "next/link";

const errorText: Record<string, string> = {
  missing_fields: "Please fill all required fields.",
  create_failed: "Could not register dealer right now. Please try again.",
  config_missing: "Dealer registration is not configured yet.",
};

export default async function DealerRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "";
  const error = params.error ?? "";

  return (
    <main className="simple-page">
      <section className="simple-shell simple-auth">
        <div className="simple-header">
          <div>
            <h1>Dealer registration</h1>
            <p>Create your dealer profile and start posting inventory.</p>
          </div>
          <Link className="simple-link" href="/">
            Back to home
          </Link>
        </div>

        {status === "created" && (
          <div className="simple-alert">
            Dealer profile created. Please verify your phone to access the dealer
            dashboard.
          </div>
        )}
        {error && (
          <div className="simple-alert simple-alert--error">
            {errorText[error] ?? "Registration failed. Please try again."}
          </div>
        )}

        <div className="dealer-register__benefits">
          <h3>Why join SangroCars?</h3>
          <ul>
            <li>Free listings with qualified buyer leads</li>
            <li>Finance support to improve closure rates</li>
            <li>Insurance assistance for faster deals</li>
            <li>Dedicated dealer dashboard and bulk uploads</li>
          </ul>
        </div>

        <form
          className="dealer-form dealer-form--stacked"
          method="post"
          action="/api/dealers/register"
          encType="multipart/form-data"
        >
          <div className="dealer-form__grid">
            <label>
              Dealership name *
              <input name="name" placeholder="e.g., Sethi Motors" required />
            </label>
            <label>
              Owner name *
              <input name="owner_name" placeholder="e.g., Rahul Sethi" required />
            </label>
            <label>
              Phone number *
              <input name="phone" type="tel" placeholder="e.g., 9876543210" required />
            </label>
            <label>
              WhatsApp number
              <input name="whatsapp" type="tel" placeholder="e.g., 9876543210" />
            </label>
            <label>
              Email *
              <input name="email" type="email" placeholder="dealer@company.com" required />
            </label>
            <label>
              City *
              <input name="city" placeholder="e.g., Jalandhar" required />
            </label>
            <label>
              Address *
              <input name="address" placeholder="Showroom address" required />
            </label>
            <label>
              Website (optional)
              <input name="website" placeholder="https://yourshowroom.com" />
            </label>
            <label>
              Dealer logo
              <input type="file" name="logo_file" accept="image/*" />
            </label>
            <label>
              Dealer banner image
              <input type="file" name="banner_file" accept="image/*" />
            </label>
          </div>

          <div className="dealer-form__services">
            <h3>Services offered</h3>
            <label>
              <input type="checkbox" name="service_finance" /> Finance available
            </label>
            <label>
              <input type="checkbox" name="service_insurance" /> Insurance assistance
            </label>
            <label>
              <input type="checkbox" name="service_rc" /> RC transfer help
            </label>
            <label>
              <input type="checkbox" name="service_test_drive" /> Test drive available
            </label>
          </div>

          <div className="dealer-form__actions">
            <button className="btn btn--solid" type="submit">
              Register dealer
            </button>
            <Link className="btn btn--outline" href="/dealer-admin/login">
              Dealer login
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
