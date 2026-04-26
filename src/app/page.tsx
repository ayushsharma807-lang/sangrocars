import Link from "next/link";

type ServiceCard = {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
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
];

export default function HomePage() {
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
                Cars • Finance • Mutual Funds • Insurance
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
      </section>
    </main>
  );
}
