import Link from "next/link";

const events = [
  {
    title: "SUV Saturday Live",
    when: "Every Saturday, 7:30 PM IST",
    offer: "Live-only exchange bonus for featured SUVs",
  },
  {
    title: "Luxury Sedan Night",
    when: "Every Wednesday, 8:00 PM IST",
    offer: "Live Q&A with finance expert + quick pre-approval",
  },
  {
    title: "EV Deep Dive",
    when: "Every Sunday, 6:00 PM IST",
    offer: "Charging setup and battery warranty walkthrough",
  },
];

export default function LiveEventsPage() {
  return (
    <main className="simple-page">
      <section className="simple-shell">
        <div className="simple-header">
          <div>
            <h1>Live Stream Sales Events</h1>
            <p>Scheduled walkthroughs with live Q&A and event-only discounts.</p>
          </div>
          <Link className="simple-link" href="/">
            Back to home
          </Link>
        </div>

        <div className="experience-grid-3">
          {events.map((event) => (
            <article className="experience-card" key={event.title}>
              <h3>{event.title}</h3>
              <p>{event.when}</p>
              <p>{event.offer}</p>
              <button className="simple-button simple-button--secondary" type="button">
                Set reminder
              </button>
            </article>
          ))}
        </div>

        <section className="simple-results">
          <h2>Live showcase preview</h2>
          <div className="experience-embed">
            <video controls src="/videos/hero-parking.mp4" />
          </div>
        </section>
      </section>
    </main>
  );
}
