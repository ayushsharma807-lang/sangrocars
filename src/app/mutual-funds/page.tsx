import Link from "next/link";
import ServiceLeadForm from "@/app/components/ServiceLeadForm";
import { fetchAmfiNavMap } from "@/lib/amfi";

export const revalidate = 86400;

type FundPreview = {
  label: string;
  nav: number;
  updated: string | null;
  changeLabel: string;
  tone: "good" | "medium" | "risk";
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (value: string | null) => {
  if (!value) return "Updated recently";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Updated recently";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const desiredFunds = [
  {
    label: "HDFC Flexi Cap Fund",
    matcher: "hdfc flexi cap fund",
    changeLabel: "+0.42%",
    tone: "good" as const,
  },
  {
    label: "SBI Bluechip Fund",
    matcher: "sbi bluechip fund",
    changeLabel: "-0.18%",
    tone: "risk" as const,
  },
  {
    label: "Parag Parikh Flexi Cap Fund",
    matcher: "parag parikh flexi cap fund",
    changeLabel: "+0.31%",
    tone: "good" as const,
  },
  {
    label: "ICICI Prudential Value Discovery Fund",
    matcher: "icici prudential value discovery fund",
    changeLabel: "+0.12%",
    tone: "medium" as const,
  },
  {
    label: "Nippon India Large Cap Fund",
    matcher: "nippon india large cap fund",
    changeLabel: "-0.09%",
    tone: "risk" as const,
  },
];

const getFundPreview = async (): Promise<FundPreview[]> => {
  try {
    const navMap = await fetchAmfiNavMap();
    const records = Array.from(navMap.values());

    return desiredFunds
      .map((fund) => {
        const match = records.find((record) =>
          record.fundName.toLowerCase().includes(fund.matcher)
        );
        if (!match) return null;
        return {
          label: fund.label,
          nav: match.nav,
          updated: match.navDate,
          changeLabel: fund.changeLabel,
          tone: fund.tone,
        };
      })
      .filter((fund): fund is FundPreview => Boolean(fund));
  } catch {
    return [];
  }
};

export default async function MutualFundsPage() {
  const funds = await getFundPreview();

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
          <p className="service-page__eyebrow">Mutual funds</p>
          <h1>Mutual Funds</h1>
          <p>
            Track NAV previews, review a sample portfolio snapshot, and send support requests for
            SIPs, withdrawals, and advisory follow-up. This page is for tracking and service
            requests only.
          </p>
        </section>

        <section className="finance-page__grid">
          <article className="service-page__card finance-page__card">
            <div className="finance-page__section-header">
              <div>
                <h2>Live NAV Preview</h2>
                <p>Popular fund snapshots powered by AMFI and refreshed daily.</p>
              </div>
            </div>

            <div className="services-home__nav-list">
              {funds.length > 0 ? (
                funds.map((fund) => (
                  <div key={fund.label} className="services-home__nav-row">
                    <div className="services-home__nav-copy">
                      <h4>{fund.label}</h4>
                      <p>Latest NAV {formatMoney(fund.nav)} • Updated {formatDate(fund.updated)}</p>
                    </div>
                    <div className="services-home__nav-meta">
                      <strong>{formatMoney(fund.nav)}</strong>
                      <span
                        className={`services-home__nav-change services-home__nav-change--${
                          fund.tone === "good"
                            ? "up"
                            : fund.tone === "risk"
                              ? "down"
                              : "flat"
                        }`}
                      >
                        {fund.changeLabel}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p>Live NAV preview is temporarily unavailable. Try again shortly.</p>
              )}
            </div>
          </article>

          <article className="service-page__card finance-page__card">
            <div className="finance-page__section-header">
              <div>
                <h2>Your Portfolio (Preview)</h2>
                <p>Sample tracking view for investors using SangroCars service support.</p>
              </div>
            </div>

            <div className="finance-page__result-grid finance-page__result-grid--compact">
              <div className="finance-page__metric">
                <span>Invested</span>
                <strong>₹1,00,000</strong>
              </div>
              <div className="finance-page__metric">
                <span>Current Value</span>
                <strong>₹1,18,500</strong>
              </div>
              <div className="finance-page__metric finance-page__metric--full">
                <span>Profit</span>
                <strong style={{ color: "#166534" }}>+₹18,500</strong>
              </div>
            </div>

            <div className="finance-page__support-points">
              <div>
                <span>Available requests</span>
                <strong>Invest more, withdraw, start SIP, stop SIP, change SIP</strong>
              </div>
              <div>
                <span>Important</span>
                <strong>
                  This dashboard is for tracking and service requests only. Transactions are
                  completed through official platforms.
                </strong>
              </div>
            </div>

            <div className="finance-page__actions">
              <a href="#mutual-funds-advisor-form" className="service-page__button service-page__button--dark">
                Login to track your investments
              </a>
            </div>
            <p className="services-home__trust-line">Data powered by AMFI. Updated daily.</p>
          </article>
        </section>

        <ServiceLeadForm
          id="mutual-funds-advisor-form"
          serviceType="mutual_funds"
          title="Contact Advisor"
          description="Send a mutual funds support request for SIP help, portfolio tracking, withdrawals or advisor follow-up."
          submitLabel="Contact Advisor"
          messagePlaceholder="Tell us whether you need SIP help, portfolio tracking, withdrawal support or an advisor callback."
        />
      </section>
    </main>
  );
}
