import Link from "next/link";
import SellCarForm from "./SellCarForm";

const errorText = {
  missing_fields: "Please fill required fields (make, model, and phone).",
  create_failed: "Could not create your ad right now. Please try again.",
  phone_unverified: "Please verify your phone number before publishing.",
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

        <SellCarForm />
      </section>
    </main>
  );
}
