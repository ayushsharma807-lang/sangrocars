import Link from "next/link";

export default function ExperiencePage() {
  return (
    <main className="simple-page">
      <section className="simple-shell">
        <div className="simple-header">
          <div>
            <h1>Immersive Buying Experience</h1>
            <p>Experience tools are being refreshed for a simpler buying journey.</p>
          </div>
          <div className="simple-detail__top-actions">
            <Link className="simple-link" href="/">
              Back to home
            </Link>
            <Link className="simple-link" href="/ai-guide">
              AI guide
            </Link>
            <Link className="simple-link" href="/garage">
              My Garage
            </Link>
          </div>
        </div>

        <div className="simple-results">
          We&apos;re simplifying the experience page to keep the focus on listings,
          dealer contact, and quick comparisons. New upgrades will appear here later.
        </div>
      </section>
    </main>
  );
}
