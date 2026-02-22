import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

type DealerOption = {
  id: string;
  name: string | null;
};

const errorText = {
  missing_fields: "Please fill required fields (make and model).",
  create_failed: "Could not create listing. Please try again.",
} as const;

export default async function AdminNewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string; id?: string }>;
}) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    redirect("/admin/login?error=unauthorized");
  }

  const params = await searchParams;
  const sb = supabaseServer();
  const { data } = await sb
    .from("dealers")
    .select("id, name")
    .order("name", { ascending: true })
    .limit(2000);
  const dealers = (data ?? []) as DealerOption[];
  const errorKey = params.error as keyof typeof errorText | undefined;

  return (
    <main className="home">
      <section className="section admin">
        <div className="section__header">
          <div>
            <h2>Post any car</h2>
            <p>Create listing as admin for dealer inventory or private seller.</p>
          </div>
          <div className="dealer__actions">
            <Link className="btn btn--ghost" href="/admin/dealers">
              Dealers
            </Link>
            <Link className="btn btn--ghost" href="/admin/listings">
              All ads
            </Link>
            <Link className="btn btn--outline" href="/admin/leads">
              Lead inbox
            </Link>
            <Link className="btn btn--solid" href="/">
              Back to home
            </Link>
          </div>
        </div>

        {params.status === "created" && (
          <div className="admin-banner">
            Listing created successfully.{" "}
            {params.id && (
              <Link className="link" href={`/listing/${params.id}`}>
                View listing
              </Link>
            )}
          </div>
        )}
        {errorKey && (
          <div className="admin-banner admin-banner--error">{errorText[errorKey]}</div>
        )}

        <form
          className="dealer-form"
          method="post"
          action="/api/admin/listings"
          encType="multipart/form-data"
        >
          <div className="dealer-form__grid">
            <label>
              Dealer account
              <select name="dealer_id" defaultValue="none">
                <option value="none">No dealer (private seller / ad-hoc)</option>
                {dealers.map((dealer) => (
                  <option key={dealer.id} value={dealer.id}>
                    {dealer.name || dealer.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select name="type" defaultValue="used">
                <option value="used">Used</option>
                <option value="new">New</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue="available">
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </label>
            <label>
              Make *
              <input name="make" placeholder="e.g., Hyundai" required />
            </label>
            <label>
              Model *
              <input name="model" placeholder="e.g., Creta" required />
            </label>
            <label>
              Variant
              <input name="variant" placeholder="e.g., SX" />
            </label>
            <label>
              Year
              <input name="year" type="number" placeholder="e.g., 2021" />
            </label>
            <label>
              Price
              <input name="price" type="number" placeholder="e.g., 950000" />
            </label>
            <label>
              KM driven
              <input name="km" type="number" placeholder="e.g., 42000" />
            </label>
            <label>
              Fuel
              <input name="fuel" placeholder="e.g., Petrol" />
            </label>
            <label>
              Transmission
              <input name="transmission" placeholder="e.g., Automatic" />
            </label>
            <label>
              Location
              <input name="location" placeholder="e.g., Jalandhar, Punjab" />
            </label>
            <label>
              Seller name (if no dealer)
              <input name="seller_name" placeholder="e.g., Rahul Sharma" />
            </label>
            <label>
              Seller phone (if no dealer)
              <input name="seller_phone" placeholder="e.g., 9876543210" />
            </label>
            <label>
              Seller email (if no dealer)
              <input name="seller_email" type="email" placeholder="e.g., you@gmail.com" />
            </label>
          </div>
          <label>
            Description
            <textarea
              name="description"
              rows={4}
              placeholder="Condition, service history, owner details..."
            />
          </label>
          <label>
            Photo URLs (one per line)
            <textarea
              name="photo_urls"
              rows={4}
              placeholder="https://example.com/photo1.jpg"
            />
          </label>
          <div className="dealer-form__grid">
            <label>
              360 tour URL
              <input name="tour_360_url" placeholder="YouTube / Meta 360 link" />
            </label>
            <label>
              Walkthrough video URL
              <input
                name="walkthrough_video_url"
                placeholder="YouTube / MP4 / social embed URL"
              />
            </label>
            <label>
              Interior VR URL
              <input name="interior_vr_url" placeholder="VR headset tour URL" />
            </label>
            <label>
              AR model (.glb)
              <input name="ar_model_url" placeholder="https://.../model.glb" />
            </label>
            <label>
              AR iOS model (.usdz)
              <input name="ar_ios_model_url" placeholder="https://.../model.usdz" />
            </label>
          </div>
          <label>
            Upload photos from phone/laptop
            <input
              type="file"
              name="photo_files"
              accept="image/*"
              capture="environment"
              multiple
            />
            <span className="dealer-form__hint">
              Works with gallery upload and live camera on mobile.
            </span>
          </label>
          <button className="btn btn--solid" type="submit">
            Create listing
          </button>
        </form>
      </section>
    </main>
  );
}
