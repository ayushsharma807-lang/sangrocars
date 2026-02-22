"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FUEL_OPTIONS,
  MAKE_OPTIONS,
  TRANSMISSION_OPTIONS,
  getModelOptions,
  getVariantOptions,
} from "@/lib/carOptions";

export default function SellCarForm() {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const modelOptions = useMemo(() => getModelOptions(make), [make]);
  const variantOptions = useMemo(() => getVariantOptions(model), [model]);

  return (
    <form
      className="dealer-form sell-form"
      method="post"
      action="/api/listings/public-post"
      encType="multipart/form-data"
    >
      <div className="dealer-form__grid">
        <label>
          Your name
          <input name="seller_name" placeholder="e.g., Rahul Sharma" />
        </label>
        <label>
          Phone *
          <input name="seller_phone" placeholder="e.g., 9876543210" required />
        </label>
        <label>
          Email
          <input name="seller_email" type="email" placeholder="e.g., you@gmail.com" />
        </label>
        <label>
          Type
          <select name="type" defaultValue="used">
            <option value="used">Used</option>
            <option value="new">New</option>
          </select>
        </label>
        <label>
          Make *
          <input
            name="make"
            list="sell-make-options"
            placeholder="Type or choose make"
            required
            value={make}
            onChange={(event) => {
              setMake(event.target.value);
              setModel("");
              setVariant("");
            }}
          />
        </label>
        <label>
          Model *
          <input
            name="model"
            list="sell-model-options"
            placeholder="Type or choose model"
            required
            value={model}
            onChange={(event) => {
              setModel(event.target.value);
              setVariant("");
            }}
          />
        </label>
        <label>
          Variant
          <input
            name="variant"
            list="sell-variant-options"
            placeholder="Type or choose variant"
            value={variant}
            onChange={(event) => setVariant(event.target.value)}
          />
        </label>
        <label>
          Year
          <input name="year" type="number" placeholder="e.g., 2021" />
        </label>
        <label>
          Price (INR)
          <input name="price" type="number" placeholder="e.g., 950000" />
        </label>
        <label>
          KM driven
          <input name="km" type="number" placeholder="e.g., 42000" />
        </label>
        <label>
          Fuel
          <input
            name="fuel"
            list="sell-fuel-options"
            placeholder="Type or choose fuel"
          />
        </label>
        <label>
          Transmission
          <input
            name="transmission"
            list="sell-transmission-options"
            placeholder="Type or choose transmission"
          />
        </label>
        <label>
          City / location
          <input name="location" placeholder="e.g., Jalandhar, Punjab" />
        </label>
      </div>

      <span className="dealer-form__hint">
        You can type your own value or select from suggestions.
      </span>

      <label>
        Description
        <textarea
          name="description"
          rows={4}
          placeholder="Condition, service history, number of owners..."
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
          Walkthrough video URL (optional)
          <input
            name="walkthrough_video_url"
            placeholder="YouTube / MP4 / Instagram / Facebook embed link"
          />
        </label>
        <label>
          360 tour URL (optional)
          <input name="tour_360_url" placeholder="YouTube 360 or virtual tour URL" />
        </label>
        <label>
          AR model URL (.glb, optional)
          <input name="ar_model_url" placeholder="https://.../model.glb" />
        </label>
        <label>
          AR iOS model URL (.usdz, optional)
          <input name="ar_ios_model_url" placeholder="https://.../model.usdz" />
        </label>
        <label>
          Interior VR URL (optional)
          <input name="interior_vr_url" placeholder="VR headset tour URL" />
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
          You can choose gallery photos or open camera on mobile.
        </span>
      </label>
      <div className="sell-form__actions">
        <Link className="simple-button simple-button--secondary" href="/listings">
          Back to listings
        </Link>
        <button className="simple-button sell-form__submit" type="submit">
          Publish my ad
        </button>
      </div>

      <datalist id="sell-make-options">
        {MAKE_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="sell-model-options">
        {modelOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="sell-variant-options">
        {variantOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="sell-fuel-options">
        {FUEL_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      <datalist id="sell-transmission-options">
        {TRANSMISSION_OPTIONS.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </form>
  );
}
