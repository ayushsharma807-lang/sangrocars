import Link from "next/link";
import ServiceLeadForm from "@/app/components/ServiceLeadForm";

export default function PropertiesPage() {
  return (
    <main className="service-page">
      <section className="service-page__shell finance-page__shell">
        <header className="service-page__header">
          <Link href="/" className="service-page__brand" aria-label="SangroCars home">
            <img src="/images/sangrocars-logo.png" alt="SangroCars" />
            <div>
              <div className="service-page__brand-name">SangroCars</div>
              <div className="service-page__brand-line">
                Cars • Properties • Finance • Mutual Funds • Insurance
              </div>
            </div>
          </Link>
          <Link href="/" className="service-page__back">
            Back to services
          </Link>
        </header>

        <section className="service-page__hero finance-page__hero">
          <p className="service-page__eyebrow">Property support</p>
          <h1>Properties</h1>
          <p>
            Buy, sell and rent residential and commercial properties with SangroCars support.
            Share your requirement and we will help with property matching and owner coordination.
          </p>
        </section>

        <section className="finance-page__grid">
          <article className="service-page__card finance-page__card">
            <div className="finance-page__section-header">
              <div>
                <h2>What we help with</h2>
                <p>Simple property support for customers looking to buy, sell or rent.</p>
              </div>
            </div>

            <div className="finance-page__support-points">
              <div>
                <span>Residential</span>
                <strong>Plots, flats, builder floors, independent houses and rental homes</strong>
              </div>
              <div>
                <span>Commercial</span>
                <strong>Shops, offices, showrooms, warehouses and investment spaces</strong>
              </div>
              <div>
                <span>Support</span>
                <strong>Requirement matching, owner coordination, site visit support and follow-up</strong>
              </div>
            </div>
          </article>

          <article className="service-page__card finance-page__card">
            <div className="finance-page__section-header">
              <div>
                <h2>Best way to enquire</h2>
                <p>Share the kind of property, location and budget you want us to work on.</p>
              </div>
            </div>

            <div className="finance-page__result-grid finance-page__result-grid--compact">
              <div className="finance-page__metric">
                <span>Buy</span>
                <strong>Homes, plots and commercial spaces</strong>
              </div>
              <div className="finance-page__metric">
                <span>Sell</span>
                <strong>Connect with serious local buyers</strong>
              </div>
              <div className="finance-page__metric finance-page__metric--full">
                <span>Rent</span>
                <strong>Residential and commercial rental support across local markets</strong>
              </div>
            </div>

            <div className="finance-page__actions">
              <a href="#properties-enquiry-form" className="service-page__button service-page__button--dark">
                View Service
              </a>
              <Link href="/contact" className="service-page__button">
                Contact SangroCars
              </Link>
            </div>
          </article>
        </section>

        <ServiceLeadForm
          id="properties-enquiry-form"
          serviceType="properties"
          title="Property enquiry"
          description="Share your property requirement and SangroCars will connect you for buying, selling or rental support."
          submitLabel="Send enquiry"
          messagePlaceholder="Tell us what kind of property you need, your city, budget or whether you want to buy, sell or rent."
        />
      </section>
    </main>
  );
}
