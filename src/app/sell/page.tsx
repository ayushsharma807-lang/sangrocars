import Link from "next/link";
import SellCarForm from "./SellCarForm";

const errorText = {
  missing_fields: "Please fill required fields (make, model, and phone).",
  create_failed: "Could not create your ad right now. Please try again.",
} as const;

export default async function SellCarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorKey = params.error as keyof typeof errorText | undefined;

  return (
    <main className="simple-page sell-page">
      <section className="simple-shell simple-auth sell-page__shell">
        <div className="simple-header sell-page__header">
          <div>
            <h1>Post your car ad</h1>
            <p>Private sellers can list cars directly in minutes.</p>
          </div>
          <div className="sell-page__top-actions">
            <Link className="simple-button simple-button--secondary" href="/listings">
              Back to listings
            </Link>
          </div>
        </div>

        {errorKey && (
          <div className="simple-alert simple-alert--error">{errorText[errorKey]}</div>
        )}

        <div className="sell-page__steps">
          <article className="sell-page__step">
            <h3>1. Add car basics</h3>
            <p>Make, model, year, and expected price.</p>
          </article>
          <article className="sell-page__step">
            <h3>2. Add photos/video</h3>
            <p>Upload from phone or paste links.</p>
          </article>
          <article className="sell-page__step">
            <h3>3. Publish</h3>
            <p>Your ad goes live and buyers can contact you.</p>
          </article>
        </div>

        <SellCarForm />
      </section>
    </main>
  );
}
