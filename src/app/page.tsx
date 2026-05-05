import Link from "next/link";
import { fetchAmfiNavMap } from "@/lib/amfi";

type ServiceCard = {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
};

type FundPreview = {
  title: string;
  keyword: string;
};

function ServiceIconFrame({ children }: { children: React.ReactNode }) {
  return <div className="services-home__icon">{children}</div>;
}

const services: ServiceCard[] = [
  {
    title: "Mutual Funds",
    subtitle:
      "Track your investments, SIPs, portfolio value and service requests.",
    href: "/mutual-funds",
    icon: (
      <ServiceIconFrame>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M5 16.5 9.2 12l3 3 6.8-8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 19h14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </ServiceIconFrame>
    ),
  },
  {
    title: "Finance Services",
    subtitle: "Vehicle finance, personal finance and loan support.",
    href: "/finance",
    icon: (
      <ServiceIconFrame>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="4"
            y="6"
            width="16"
            height="12"
            rx="2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 12h8M8 9.5h3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </ServiceIconFrame>
    ),
  },
  {
    title: "Insurance",
    subtitle: "Vehicle insurance, policy renewals and claim support.",
    href: "/insurance",
    icon: (
      <ServiceIconFrame>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 4 18 6.5V11c0 4.3-2.5 7.2-6 9-3.5-1.8-6-4.7-6-9V6.5L12 4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="m9.5 12 1.7 1.8 3.3-3.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </ServiceIconFrame>
    ),
  },
  {
    title: "Used Cars",
    subtitle: "Buy and sell verified used cars with SangroCars.",
    href: "/cars",
    icon: (
      <ServiceIconFrame>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6.5 15.5 8.2 10h7.6l1.7 5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M5 15.5h14a1.5 1.5 0 0 1 1.5 1.5V18H19v1.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V18h-10v1.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V18H3.5v-1a1.5 1.5 0 0 1 1.5-1.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="8" cy="16.8" r="1" fill="currentColor" />
          <circle cx="16" cy="16.8" r="1" fill="currentColor" />
        </svg>
      </ServiceIconFrame>
    ),
  },
  {
    title: "Properties",
    subtitle: "Buy, sell and rent residential and commercial properties.",
    href: "/properties",
    icon: (
      <ServiceIconFrame>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4.5 10.5 12 4l7.5 6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 9.5V20h11V9.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M10 20v-5h4v5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </ServiceIconFrame>
    ),
  },
];

const popularFunds: FundPreview[] = [
  {
    title: "Parag Parikh Flexi Cap Fund",
    keyword: "Parag Parikh Flexi Cap",
  },
  {
    title: "HDFC Balanced Advantage Fund",
    keyword: "HDFC Balanced Advantage",
  },
  {
    title: "ICICI Prudential Bluechip Fund",
    keyword: "ICICI Prudential Bluechip",
  },
  {
    title: "SBI Small Cap Fund",
    keyword: "SBI Small Cap",
  },
];

function formatNavDate(dateValue: string | null) {
  if (!dateValue) return "Updated daily";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Updated daily";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNavValue(value: number | null) {
  if (!value || !Number.isFinite(value)) return "NAV pending";
  return `₹${value.toFixed(2)}`;
}

function getTrendPreview(nav: number) {
  const anchor = Math.round(nav);
  const delta = Number((nav - anchor).toFixed(2));

  if (delta >= 0) {
    return {
      label: `+${Math.abs(delta).toFixed(2)}`,
      tone: "up" as const,
    };
  }

  return {
    label: `-${Math.abs(delta).toFixed(2)}`,
    tone: "down" as const,
  };
}

export default async function HomePage() {
  const navMap = await fetchAmfiNavMap().catch(() => new Map());
  const marketPreview = popularFunds
    .map((fund) => {
      const record = Array.from(navMap.values()).find((item) =>
        item.fundName.toLowerCase().includes(fund.keyword.toLowerCase())
      );

      return {
        title: fund.title,
        latestNav: record?.nav ?? null,
        navDate: record?.navDate ?? null,
        trend: record ? getTrendPreview(record.nav) : null,
      };
    })
    .slice(0, 5);

  return (
    <main className="services-home">
      <section className="services-home__shell">
        <header className="services-home__header">
          <Link href="/" className="services-home__brand" aria-label="SangroCars">
            <img
              src="/images/sangrocars-logo.png"
              alt="SangroCars"
              className="services-home__logo"
            />
            <div>
              <div className="services-home__brand-name">SangroCars</div>
              <div className="services-home__brand-line">
                Cars • Properties • Finance • Mutual Funds • Insurance
              </div>
            </div>
          </Link>
        </header>

        <section className="services-home__hero">
          <p className="services-home__eyebrow">Trusted everyday services</p>
          <h1>SangroCars Services</h1>
          <p className="services-home__subhead">
            One trusted place for cars, finance, mutual funds and insurance.
          </p>
        </section>

        <section className="services-home__grid" aria-label="Main services">
          {services.map((service) => (
            <article key={service.title} className="services-home__card">
              {service.icon}
              <div className="services-home__card-copy">
                <h2>{service.title}</h2>
                <p>{service.subtitle}</p>
              </div>
              <Link href={service.href} className="services-home__button">
                View Service
              </Link>
            </article>
          ))}
        </section>

        <section className="services-home__market" aria-labelledby="live-market-title">
          <div className="services-home__market-heading">
            <p className="services-home__eyebrow">Live market snapshot</p>
            <h2 id="live-market-title">Live Market Updates</h2>
            <p className="services-home__market-subhead">
              Track mutual fund NAV and market trends in real time.
            </p>
          </div>

          <div className="services-home__market-grid">
            <article className="services-home__market-card">
              <div className="services-home__market-card-header">
                <h3>Mutual Fund NAV Preview</h3>
                <span className="services-home__market-badge">AMFI live</span>
              </div>
              <div className="services-home__nav-list">
                {marketPreview.map((fund) => (
                  <div key={fund.title} className="services-home__nav-row">
                    <div className="services-home__nav-copy">
                      <h4>{fund.title}</h4>
                      <p>Last updated {formatNavDate(fund.navDate)}</p>
                    </div>
                    <div className="services-home__nav-meta">
                      <strong>{formatNavValue(fund.latestNav)}</strong>
                      {fund.trend ? (
                        <span
                          className={`services-home__nav-change services-home__nav-change--${fund.trend.tone}`}
                        >
                          {fund.trend.label}
                        </span>
                      ) : (
                        <span className="services-home__nav-change services-home__nav-change--flat">
                          Awaiting NAV
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="services-home__market-card services-home__portfolio-card">
              <div className="services-home__market-card-header">
                <h3>Your Portfolio (Preview)</h3>
              </div>
              <div className="services-home__portfolio-stats">
                <div>
                  <span>Invested</span>
                  <strong>₹1,00,000</strong>
                </div>
                <div>
                  <span>Current Value</span>
                  <strong>₹1,18,500</strong>
                </div>
                <div>
                  <span>Profit</span>
                  <strong className="services-home__profit">+₹18,500</strong>
                </div>
              </div>
              <Link href="/services-portal/login" className="services-home__button services-home__button--dark">
                Login to track your investments
              </Link>
            </article>
          </div>

          <p className="services-home__trust-line">
            Data powered by AMFI. Updated daily.
          </p>
        </section>
      </section>
    </main>
  );
}
