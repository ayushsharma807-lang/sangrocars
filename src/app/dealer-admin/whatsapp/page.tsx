import { redirect } from "next/navigation";
import DealerNav from "../DealerNav";
import { requireDealer } from "@/lib/dealerAuth";

const errorText = {
  empty_message: "Please paste the WhatsApp message first.",
  missing_make_model: "Could not find make/model. Add car name like: Hyundai Creta.",
  create_failed: "Could not create listing from this message. Try again.",
} as const;

export default async function DealerWhatsAppPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const auth = await requireDealer();
  if (!auth.ok) {
    const error = auth.error === "dealer_not_found" ? "dealer_not_found" : "unauthorized";
    redirect(`/dealer-admin/login?error=${error}`);
  }

  const params = (await searchParams) ?? {};
  const errorKey = params.error as keyof typeof errorText | undefined;

  return (
    <main className="home dealer-admin">
      <DealerNav dealerId={auth.dealer.id} dealerName={auth.dealer.name} />
      <section className="section">
        <div className="section__header">
          <div>
            <h2>WhatsApp posting</h2>
            <p>Simple mode: paste dealer message and publish in one click.</p>
          </div>
        </div>

        {errorKey ? <p className="dealer-wizard__error">{errorText[errorKey]}</p> : null}

        <div className="dealer-whatsapp">
          <article className="dealer-whatsapp__card">
            <h3>Quick post from WhatsApp text</h3>
            <p>
              Copy message from WhatsApp and paste here. We auto-read price,
              year, km, fuel and location.
            </p>
            <form className="dealer-form" method="post" action="/api/dealer/whatsapp-post">
              <label>
                Message
                <textarea
                  name="message"
                  rows={6}
                  placeholder="Hyundai Creta SX 2021 petrol automatic 42000 km price 12.9L city Jalandhar"
                  required
                />
              </label>
              <label>
                Extra photo URLs (optional)
                <textarea
                  name="photo_urls"
                  rows={3}
                  placeholder="https://site.com/photo1.jpg"
                />
              </label>
              <button className="btn btn--solid" type="submit">
                Create listing
              </button>
            </form>
          </article>

          <article className="dealer-whatsapp__card">
            <h3>Automatic bot setup</h3>
            <p>
              To auto-create listings directly from WhatsApp Business provider,
              use this webhook URL:
            </p>
            <code className="dealer-whatsapp__code">/api/whatsapp/incoming</code>
            <p className="dealer-form__hint">
              Add header or query token with <code>WHATSAPP_SYNC_TOKEN</code>.
              Dealer phone/WhatsApp must be saved in Profile for mapping.
            </p>
            <p className="dealer-form__hint">
              Recommended message format:{" "}
              <strong>
                Make Model Year Fuel Transmission KM Price City + Photos
              </strong>
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
