import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="simple-page">
      <section className="simple-shell">
        <div className="simple-card">
          <h1>You are offline</h1>
          <p>
            We could not load the latest listings. Please check your connection.
          </p>
          <Link className="simple-button" href="/listings">
            Retry listings
          </Link>
        </div>
      </section>
    </main>
  );
}
