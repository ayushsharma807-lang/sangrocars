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
  const [sellingPrice, setSellingPrice] = useState("");
  const [netPrice, setNetPrice] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modelOptions = useMemo(() => getModelOptions(make), [make]);
  const variantOptions = useMemo(() => getVariantOptions(model), [model]);

  const marginValue = (() => {
    const selling = Number(sellingPrice);
    const net = Number(netPrice);
    return Number.isFinite(selling) && selling > 0 && Number.isFinite(net) && net > 0
      ? selling - net
      : null;
  })();

  const submitForm = async () => {
    if (!formRef.current) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(formRef.current);
      const response = await fetch("/api/admin/listings", {
        method: "POST",
        body: formData,
        headers: {
          "x-admin-form": "1",
        },
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; message?: string; redirectTo?: string }
        | null;

      if (!response.ok || !payload?.ok || !payload.redirectTo) {
        const errorMessage =
          payload?.message ??
          (payload?.error === "private_seller_missing"
            ? "Private seller name and phone are required when no dealer is selected."
            : "Could not create listing. Please try again.");
        console.error("Admin create listing failed", {
          status: response.status,
          payload,
          dealerId,
          mode: dealerId === "none" ? "private_seller" : "dealer",
        });
        setSubmitError(errorMessage);
        return;
      }

      formRef.current?.reset();
      setMake("");
      setModel("");
      setVariant("");
      setSellingPrice("");
      setNetPrice("");
      setSubmitError(null);
      setDealerId(String(formData.get("dealer_id") ?? "none") || "none");
      router.replace(payload.redirectTo, { scroll: false });
      router.refresh();
    } catch (error) {
      console.error("Admin create listing request crashed", error);
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
      action="/api/admin/listings"
      method="post"
      onSubmit={(event) => {
        event.preventDefault();
      }}
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
          onChange={setMake}
          options={MAKE_OPTIONS}
          placeholder="Type or search make"
          required
        />
        <ListingComboboxField
          label="Model *"
          name="model"
          value={model}
          onChange={setModel}
          options={modelOptions}
          placeholder={make ? "Type or search model" : "Type model or select make first"}
          required
        />
        <ListingComboboxField
          label="Variant"
          name="variant"
          value={variant}
          onChange={setVariant}
          options={variantOptions}
          placeholder={model ? "Type or search variant" : "Type variant or select model first"}
        />
        <label>
          Year
          <input name="year" type="number" placeholder="e.g., 2021" />
        </label>
        <label>
          Selling Price
          <input
            name="price"
            type="number"
            placeholder="e.g., 270000"
            value={sellingPrice}
            onChange={(event) => setSellingPrice(event.target.value)}
          />
        </label>
        <label>
          Net Price (Seller Price)
          <input
            name="net_price"
            type="number"
            placeholder="Seller's minimum price"
            value={netPrice}
            onChange={(event) => setNetPrice(event.target.value)}
          />
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
          Seller name {dealerId === "none" ? "*" : "(if no dealer)"}
          <input
            name="seller_name"
            placeholder="e.g., Rahul Sharma"
            required={dealerId === "none"}
          />
        </label>
        <label>
          Seller phone {dealerId === "none" ? "*" : "(if no dealer)"}
          <input
            name="seller_phone"
            placeholder="e.g., 9876543210"
            required={dealerId === "none"}
          />
        </label>
        <label>
          Seller email (if no dealer)
          <input name="seller_email" type="email" placeholder="e.g., you@gmail.com" />
        </label>
      </div>
      <div className="admin-car-form__margin">
        <span>Your Margin</span>
        <strong>
          {marginValue !== null ? `₹${marginValue.toLocaleString("en-IN")}` : "—"}
        </strong>
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
      <button
        className="btn btn--solid"
        type="button"
        disabled={isSubmitting}
        onClick={submitForm}
      >
        {isSubmitting ? "Creating..." : "Create listing"}
      </button>
    </form>
  );
}
