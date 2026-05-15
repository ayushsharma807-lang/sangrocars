import Link from "next/link";

const buildSupportWhatsApp = () => {
  const raw =
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ??
    process.env.NEXT_PUBLIC_SANGRO_PHONE ??
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const message =
    process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ??
    "Hi, I want to know more about Sangro.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

export default function AboutPage() {
  const whatsappHref = buildSupportWhatsApp();

  return (
    <main className="simple-page carwale-listings-page">
      <section className="simple-shell">
        <nav className="cw-nav">
          <div className="cw-nav__brand">
            <img src="/images/sangrocars-logo.png" alt="Sangro" />
            <span>Sangro</span>
          </div>
          <div className="cw-nav__links">
            <Link href="/listings">Browse Cars</Link>
            <Link href="/sell">Sell Car</Link>
            <Link href="/dealer-admin/login">Dealer Login</Link>
            <Link href="/deals-of-the-week">Deals of Week</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </nav>

        <section className="cw-about-hero">
          <div className="cw-about-hero__copy">
            <span className="cw-about-kicker">About Sangro</span>
            <h1>About Sangro</h1>
            <p>
              Sangro is a trusted local services platform based in Jalandhar, India.
              We help people with cars, properties, finance, insurance, and mutual
              fund service workflows in one simple place.
            </p>
          </div>
        </section>

        <section className="cw-about-grid">
          <article className="cw-about-card">
            <h2>What we do</h2>
            <ul>
              <li>Run Sangro Cars for verified used car listings</li>
              <li>Support Sangro Finance, Insurance, Wealth, and Properties requests</li>
              <li>Assist with paperwork, finance, insurance, and local follow-up</li>
            </ul>
          </article>

          <article className="cw-about-card">
            <h2>Why Sangro</h2>
            <ul>
              <li>One brand for multiple trusted local services</li>
              <li>Human support for important buying and finance decisions</li>
              <li>Focused on Punjab-first service and follow-up</li>
            </ul>
          </article>

          <article className="cw-about-card cw-about-card--contact" id="contact">
            <h2>Contact information</h2>
            <div className="cw-about-contact-list">
              <p>
                <strong>Location:</strong> Jalandhar, Punjab
              </p>
              <p>
                <strong>Support:</strong>{" "}
                {whatsappHref ? (
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    WhatsApp support available
                  </a>
                ) : (
                  "WhatsApp support available"
                )}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:support@sangrocars.in">support@sangrocars.in</a>
              </p>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
