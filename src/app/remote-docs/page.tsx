import Link from "next/link";
import RemoteDocsManager from "@/app/components/RemoteDocsManager";

export default function RemoteDocsPage() {
  return (
    <main className="simple-page">
      <section className="simple-shell">
        <div className="simple-header">
          <div>
            <h1>Remote Document Management</h1>
            <p>Complete paperwork and identity checks before showroom pickup.</p>
          </div>
          <div className="simple-detail__top-actions">
            <Link className="simple-link" href="/">
              Back to home
            </Link>
            <Link className="simple-link" href="/deal-builder">
              Deal builder
            </Link>
          </div>
        </div>
        <RemoteDocsManager />
      </section>
    </main>
  );
}
