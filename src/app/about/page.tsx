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
    "Hi, I want to know more about SangroCars.";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

export default function AboutPage() {
  const whatsappHref = buildSupportWhatsApp();

  return (
    <main className="simple-page carwale-listings-page">
      <section className="simple-shell">
        <nav className="cw-nav">
          <div className="cw-nav__brand">
            <img src="/images/sangrocars-logo.png" alt="SangroCars" />
            <span>SangroCars</span>
          </div>
          <div className="cw-nav__links">
            <Link href="/listings">Browse Cars</Link>
            <Link href="/sell">Sell Car</Link>
            <Link href="/dealer-admin/login">Dealer Login</Link>
            <Link href="/deals-of-the-week">Deals of Week</Link>
            <Link href="/about">About</Link>
            <Link href="/listings#contact">Contact</Link>
          </div>
        </nav>

        <section className="cw-about-hero">
          <div className="cw-about-hero__copy">
            <span className="cw-about-kicker">About SangroCars</span>
            <h1>About SangroCars</h1>
            <p>
              SangroCars is a trusted used car marketplace based in Jalandhar, India.
              Our mission is to make buying and selling used cars simple,
              transparent, and safe.
            </p>
          </div>
        </section>

        <section className="cw-about-grid">
          <article className="cw-about-card">
            <h2>What we do</h2>
            <ul>
              <li>Connect buyers directly with verified dealers and owners</li>
              <li>Provide transparent listings with real photos and details</li>
              <li>Assist with paperwork, finance, and insurance</li>
            </ul>
          </article>

          <article className="cw-about-card">
            <h2>Why SangroCars</h2>
            <ul>
              <li>Verified listings</li>
              <li>Direct negotiation with sellers</li>
              <li>Local car marketplace focused on Punjab</li>
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
