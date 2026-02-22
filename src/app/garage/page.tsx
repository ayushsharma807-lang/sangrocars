import Link from "next/link";
import MyGarageDashboard from "@/app/components/MyGarageDashboard";

export default function GaragePage() {
  return (
    <main className="simple-page">
      <section className="simple-shell">
        <div className="simple-header">
          <div>
            <h1>My Garage</h1>
            <p>Saved cars, saved builds, value tracking, and proactive reminders.</p>
          </div>
          <div className="simple-detail__top-actions">
            <Link className="simple-link" href="/">
              Back to home
            </Link>
            <Link className="simple-link" href="/ai-guide">
              AI guide
            </Link>
          </div>
        </div>
        <MyGarageDashboard />
      </section>
    </main>
  );
}
