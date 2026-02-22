import Link from "next/link";
import UnifiedDealBuilder from "@/app/components/UnifiedDealBuilder";

export default function DealBuilderPage() {
  return (
    <main className="simple-page">
      <section className="simple-shell">
        <div className="simple-header">
          <div>
            <h1>Unified Dealmaking</h1>
            <p>Start online and continue in showroom without repeating steps.</p>
          </div>
          <div className="simple-detail__top-actions">
            <Link className="simple-link" href="/">
              Back to home
            </Link>
            <Link className="simple-link" href="/remote-docs">
              Remote docs
            </Link>
          </div>
        </div>
        <UnifiedDealBuilder />
      </section>
    </main>
  );
}
