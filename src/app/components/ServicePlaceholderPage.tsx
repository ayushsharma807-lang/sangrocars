import Link from "next/link";

type ServicePlaceholderPageProps = {
  title: string;
  description: string;
  note: string;
  primaryHref: string;
  primaryLabel: string;
};

export default function ServicePlaceholderPage({
  title,
  description,
  note,
  primaryHref,
  primaryLabel,
}: ServicePlaceholderPageProps) {
  return (
    <main className="service-page">
      <section className="service-page__shell">
        <header className="service-page__header">
          <Link href="/" className="service-page__brand" aria-label="SangroCars home">
            <img src="/images/sangrocars-logo.png" alt="SangroCars" />
            <div>
              <div className="service-page__brand-name">SangroCars</div>
              <div className="service-page__brand-line">
                Cars • Finance • Mutual Funds • Insurance
              </div>
            </div>
          </Link>
          <Link href="/" className="service-page__back">
            Back to services
          </Link>
        </header>

        <section className="service-page__hero">
          <p className="service-page__eyebrow">Service page</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </section>

        <section className="service-page__card">
          <h2>Coming next</h2>
          <p>{note}</p>
          <div className="service-page__actions">
            <Link href={primaryHref} className="service-page__button service-page__button--dark">
              {primaryLabel}
            </Link>
            <Link href="/contact" className="service-page__button">
              Contact SangroCars
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
