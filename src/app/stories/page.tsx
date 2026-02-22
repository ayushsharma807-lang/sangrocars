import Link from "next/link";

const stories = [
  {
    title: "Weekend Escape: Fortuner 4x4",
    text: "Cinematic reel focused on capability, comfort, and road presence.",
  },
  {
    title: "City Luxury: BMW 3 Series",
    text: "Lifestyle-first story with urban drive footage and ownership moments.",
  },
  {
    title: "Family Upgrade: Innova HyCross",
    text: "Practical storytelling around comfort, safety, and real family use.",
  },
];

const staff = [
  {
    name: "Aman Verma",
    role: "Senior Product Specialist",
    line: "Focuses on first-time premium buyers and transparent consultations.",
  },
  {
    name: "Neha Kapoor",
    role: "Finance Advisor",
    line: "Explains loan options and helps customers compare total ownership cost.",
  },
  {
    name: "Rohit Saini",
    role: "Delivery Manager",
    line: "Handles documentation and handover with pre-delivery quality checks.",
  },
];

const reviews = [
  "We booked online and finished delivery in one visit. Very smooth process.",
  "Video walkthrough matched the car exactly. No surprises at inspection.",
  "Trade-in offer and financing were clear and fast.",
];

export default function StoriesPage() {
  return (
    <main className="simple-page">
      <section className="simple-shell">
        <div className="simple-header">
          <div>
            <h1>Trust & Community</h1>
            <p>Cinematic stories, team spotlights, and buyer testimonials.</p>
          </div>
          <div className="simple-detail__top-actions">
            <Link className="simple-link" href="/">
              Back to home
            </Link>
            <Link className="simple-link" href="/learn">
              How-to hub
            </Link>
          </div>
        </div>

        <section className="simple-results">
          <h2>Cinematic storytelling</h2>
          <div className="experience-grid-3">
            {stories.map((story) => (
              <article className="experience-card" key={story.title}>
                <h3>{story.title}</h3>
                <p>{story.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="simple-results">
          <h2>Employee spotlights</h2>
          <div className="experience-grid-3">
            {staff.map((member) => (
              <article className="experience-card" key={member.name}>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
                <p>{member.line}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="simple-results">
          <h2>Recent buyer reviews</h2>
          <ul className="experience-list">
            {reviews.map((review) => (
              <li key={review}>{review}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}
