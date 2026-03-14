import Link from "next/link";
import ContactSection from "@/app/components/ContactSection";

export default function ContactPage() {
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
            <Link href="/contact">Contact</Link>
          </div>
        </nav>

        <ContactSection source="contact_page" />
      </section>
    </main>
  );
}
