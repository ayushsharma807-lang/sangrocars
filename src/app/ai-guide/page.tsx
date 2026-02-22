import Link from "next/link";
import AIShoppingGuide from "@/app/components/AIShoppingGuide";

const predictiveCards = [
  {
    title: "Dynamic predictive pricing",
    text: "Uses live market comps plus your browsing history to show if current price is below/above your range.",
  },
  {
    title: "AI shopping concierge",
    text: "Ask natural questions and get model recommendations with reasons, budget fit, and location.",
  },
  {
    title: "Proactive ownership view",
    text: "Connect with My Garage to track value, reminders, and saved builds in one place.",
  },
];

export default function AIGuidePage() {
  return (
    <main className="simple-page">
      <section className="simple-shell">
        <div className="simple-header">
          <div>
            <h1>AI-Powered Personalisation</h1>
            <p>Concierge recommendations, predictive pricing, and personalized actions.</p>
          </div>
          <div className="simple-detail__top-actions">
            <Link className="simple-link" href="/">
              Back to home
            </Link>
            <Link className="simple-link" href="/garage">
              Open My Garage
            </Link>
          </div>
        </div>

        <div className="experience-grid-3">
          {predictiveCards.map((card) => (
            <article className="experience-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>

        <section className="simple-results">
          <h2>AI shopping guide</h2>
          <AIShoppingGuide />
        </section>
      </section>
    </main>
  );
}
