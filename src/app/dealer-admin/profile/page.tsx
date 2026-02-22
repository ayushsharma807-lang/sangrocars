import Image from "next/image";
import { redirect } from "next/navigation";
import DealerNav from "../DealerNav";
import { requireDealer } from "@/lib/dealerAuth";

export default async function DealerProfilePage() {
  const auth = await requireDealer();
  if (!auth.ok) {
    const error = auth.error === "dealer_not_found" ? "dealer_not_found" : "unauthorized";
    redirect(`/dealer-admin/login?error=${error}`);
  }

  const dealer = auth.dealer;
  const logoUrl = dealer.logo_url ?? "";

  return (
    <main className="home dealer-admin">
      <DealerNav dealerId={dealer.id} dealerName={dealer.name} />
      <section className="section">
        <div className="section__header">
          <div>
            <h2>Dealer profile</h2>
            <p>Update your showroom details shown on the public page.</p>
          </div>
        </div>
        <form
          className="dealer-form"
          method="post"
          action="/api/dealer/profile"
          encType="multipart/form-data"
        >
          {logoUrl ? (
            <div className="dealer-logo-preview">
              <Image
                src={logoUrl}
                alt={`${dealer.name ?? "Dealer"} logo`}
                width={120}
                height={120}
              />
              <div>
                <p className="dealer-form__hint">Current logo</p>
                <p className="dealer-form__hint">
                  Uploading a new file will replace this.
                </p>
              </div>
            </div>
          ) : null}
          <div className="dealer-form__grid">
            <label>
              Dealer name
              <input name="name" defaultValue={dealer.name ?? ""} required />
            </label>
            <label>
              Phone
              <input name="phone" defaultValue={dealer.phone ?? ""} />
            </label>
            <label>
              WhatsApp
              <input name="whatsapp" defaultValue={dealer.whatsapp ?? ""} />
            </label>
            <label>
              Email
              <input name="email" defaultValue={dealer.email ?? ""} />
            </label>
            <label>
              Address
              <input name="address" defaultValue={dealer.address ?? ""} />
            </label>
            <label>
              Upload logo
              <input type="file" name="logo_file" accept="image/*" />
              <span className="dealer-form__hint">
                Use a square PNG/JPG for best results.
              </span>
            </label>
            <label>
              Logo URL
              <input name="logo_url" defaultValue={dealer.logo_url ?? ""} />
            </label>
            <label>
              Inventory feed URL
              <input name="feed_url" defaultValue={dealer.feed_url ?? ""} />
              <span className="dealer-form__hint">
                Paste your CSV or JSON feed link to auto-sync listings.
              </span>
            </label>
            <label>
              Inventory website URL
              <input
                name="inventory_url"
                defaultValue={dealer.inventory_url ?? ""}
              />
              <span className="dealer-form__hint">
                If you have written permission, we can auto-copy listings from
                this page.
              </span>
            </label>
            <label>
              Sitemap URL (optional)
              <input
                name="sitemap_url"
                defaultValue={dealer.sitemap_url ?? ""}
              />
              <span className="dealer-form__hint">
                Helps us find all cars faster if your site has a sitemap.
              </span>
            </label>
          </div>
          <label>
            Description
            <textarea
              name="description"
              rows={4}
              defaultValue={dealer.description ?? ""}
            />
          </label>
          <button className="btn btn--solid" type="submit">
            Save profile
          </button>
        </form>
      </section>
    </main>
  );
}
