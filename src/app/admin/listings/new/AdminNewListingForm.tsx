"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FUEL_OPTIONS,
  MAKE_OPTIONS,
  TRANSMISSION_OPTIONS,
  getModelOptions,
  getVariantOptions,
} from "@/lib/carOptions";
import ListingComboboxField from "@/app/admin/listings/ListingComboboxField";

type DealerOption = {
  id: string;
  name: string | null;
};

export default function AdminNewListingForm({
  dealers,
}: {
  dealers: DealerOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [dealerId, setDealerId] = useState("none");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modelOptions = useMemo(() => getModelOptions(make), [make]);
  const variantOptions = useMemo(() => getVariantOptions(model), [model]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/listings", {
        method: "POST",
        body: formData,
        headers: {
          "x-admin-form": "1",
        },
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; redirectTo?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.redirectTo) {
        const errorCode = payload?.error ?? "create_failed";
        router.replace(`/admin/listings/new?error=${errorCode}`);
        router.refresh();
        return;
      }

      formRef.current?.reset();
      setMake("");
      setModel("");
      setVariant("");
      setSubmitError(null);
      setDealerId(String(formData.get("dealer_id") ?? "none") || "none");
      router.replace(payload.redirectTo, { scroll: false });
      router.refresh();
    } catch {
      setSubmitError("Could not create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      className="dealer-form admin-car-form"
      encType="multipart/form-data"
      onSubmit={handleSubmit}
    >
      <div className="dealer-form__grid">
        <label>
          Dealer account
          <select
            name="dealer_id"
            value={dealerId}
            onChange={(event) => setDealerId(event.target.value)}
          >
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
        <ListingComboboxField
          label="Make *"
          name="make"
          value={make}
          onChange={(value) => setMake(value)}
          options={MAKE_OPTIONS}
          placeholder="Type or search make"
          required
        />
        <ListingComboboxField
          label="Model *"
          name="model"
          value={model}
          onChange={(value) => setModel(value)}
          options={modelOptions}
          placeholder={make ? "Type or search model" : "Type model or select make first"}
          required
        />
        <ListingComboboxField
          label="Variant"
          name="variant"
          value={variant}
          onChange={(value) => setVariant(value)}
          options={variantOptions}
          placeholder={model ? "Type or search variant" : "Type variant or select model first"}
        />
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
          <select name="fuel" defaultValue="">
            <option value="">Select fuel</option>
            {FUEL_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Transmission
          <select name="transmission" defaultValue="">
            <option value="">Select transmission</option>
            {TRANSMISSION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
      {submitError ? (
        <div className="admin-banner admin-banner--error">{submitError}</div>
      ) : null}
      <button className="btn btn--solid" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create listing"}
      </button>
    </form>
  );
}
