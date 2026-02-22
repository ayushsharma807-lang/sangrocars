import Link from "next/link";

const guides = [
  {
    title: "Used car inspection checklist",
    summary: "15-point checklist before token payment or final deal closure.",
  },
  {
    title: "EV charging in India explained",
    summary: "Home charging setup, public fast charging, and battery care basics.",
  },
  {
    title: "Monsoon and winter driving safety",
    summary: "Tyres, braking distance, visibility, and maintenance for seasonal roads.",
  },
  {
    title: "Loan vs cash: total cost breakdown",
    summary: "Understand EMI, interest impact, and ownership cost over 3-5 years.",
  },
  {
    title: "How to sell your old car faster",
    summary: "Pricing, photos, paperwork prep, and negotiation strategy.",
  },
  {
    title: "First-time buyer handbook",
    summary: "How to compare models, inspect ownership docs, and close safely.",
  },
];

export default function LearnPage() {
  return (
    <main className="simple-page">
      <section className="simple-shell">
        <div className="simple-header">
          <div>
            <h1>Educational How-To Hub</h1>
            <p>Maintenance tips, ownership guides, and car buying explainers.</p>
          </div>
          <Link className="simple-link" href="/">
            Back to home
          </Link>
        </div>

        <div className="experience-grid-3">
          {guides.map((guide) => (
            <article className="experience-card" key={guide.title}>
              <h3>{guide.title}</h3>
              <p>{guide.summary}</p>
              <button className="simple-link-btn" type="button">
                Open guide
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
