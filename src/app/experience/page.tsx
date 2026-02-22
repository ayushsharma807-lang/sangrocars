import Link from "next/link";
import CarConfigurator from "@/app/components/CarConfigurator";
import TradeInValuator from "@/app/components/TradeInValuator";
import WebArViewer from "@/app/components/WebArViewer";

export default function ExperiencePage() {
  return (
    <main className="simple-page">
      <section className="simple-shell">
        <div className="simple-header">
          <div>
            <h1>Immersive Buying Experience</h1>
            <p>AR/VR tours, live configurator, and instant trade-in pricing.</p>
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

        <div className="experience-stack">
          <section className="simple-results">
            <h2>AR / VR virtual test drive</h2>
            <p>
              Use WebAR to place a 3D model at home. For production, upload each
              car&apos;s own GLB/USDZ model in the dealer listing form.
            </p>
            <WebArViewer
              modelUrl="https://modelviewer.dev/shared-assets/models/Astronaut.glb"
              iosModelUrl="https://modelviewer.dev/shared-assets/models/Astronaut.usdz"
              title="AR placement demo"
            />
          </section>

          <section className="simple-results">
            <h2>Interactive vehicle configurator</h2>
            <p>Change trim, color, and accessories with real-time pricing updates.</p>
            <CarConfigurator basePrice={2_350_000} title="Demo vehicle build" />
          </section>

          <section className="simple-results">
            <h2>360-degree video walkthrough</h2>
            <p>Exterior and interior immersive walkarounds for remote buyers.</p>
            <div className="experience-embed">
              <video controls src="/videos/hero-parking.mp4" />
            </div>
            <p className="experience-note">
              Dealers can add YouTube/Instagram/Facebook walkthrough links per listing.
            </p>
          </section>

          <section className="simple-results">
            <h2>Instant trade-in valuation</h2>
            <p>Real-time estimate from market comps, mileage, and condition.</p>
            <TradeInValuator make="Hyundai" model="Creta" currentPrice={1_450_000} />
          </section>
        </div>
      </section>
    </main>
  );
}
