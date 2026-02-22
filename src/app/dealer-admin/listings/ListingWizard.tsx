"use client";

import { useMemo, useState } from "react";
import VoicePostHelper from "./VoicePostHelper";

type Props = {
  action: string;
  submitLabel: string;
};

type WizardState = {
  type: string;
  status: string;
  make: string;
  model: string;
  variant: string;
  year: string;
  price: string;
  km: string;
  fuel: string;
  transmission: string;
  location: string;
  description: string;
  photo_urls: string;
  tour_360_url: string;
  walkthrough_video_url: string;
  interior_vr_url: string;
  ar_model_url: string;
  ar_ios_model_url: string;
};

const defaultState: WizardState = {
  type: "used",
  status: "available",
  make: "",
  model: "",
  variant: "",
  year: "",
  price: "",
  km: "",
  fuel: "",
  transmission: "",
  location: "",
  description: "",
  photo_urls: "",
  tour_360_url: "",
  walkthrough_video_url: "",
  interior_vr_url: "",
  ar_model_url: "",
  ar_ios_model_url: "",
};

const formatPrice = (value: string) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return "Price not set";
  return `Rs ${num.toLocaleString("en-IN")}`;
};

export default function ListingWizard({ action, submitLabel }: Props) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [form, setForm] = useState<WizardState>(defaultState);

  const photoCount = useMemo(
    () =>
      form.photo_urls
        .split(/[\n,|]/)
        .map((item) => item.trim())
        .filter(Boolean).length,
    [form.photo_urls]
  );

  const updateField = (key: keyof WizardState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  const applyVoicePatch = (patch: Partial<Record<keyof WizardState, string>>) => {
    setForm((prev) => {
      const next = { ...prev };
      for (const [key, value] of Object.entries(patch)) {
        if (!value) continue;
        next[key as keyof WizardState] = value;
      }
      return next;
    });
    if (error) setError("");
  };

  const goNext = () => {
    if (step === 1) {
      if (!form.make.trim() || !form.model.trim()) {
        setError("Please add make and model first.");
        return;
      }
    }
    if (step < 3) setStep((prev) => prev + 1);
  };

  const goBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  return (
    <form
      className="dealer-wizard"
      method="post"
      action={action}
      encType="multipart/form-data"
    >
      <input type="hidden" name="type" value={form.type} />
      <input type="hidden" name="status" value={form.status} />
      <input type="hidden" name="make" value={form.make} />
      <input type="hidden" name="model" value={form.model} />
      <input type="hidden" name="variant" value={form.variant} />
      <input type="hidden" name="year" value={form.year} />
      <input type="hidden" name="price" value={form.price} />
      <input type="hidden" name="km" value={form.km} />
      <input type="hidden" name="fuel" value={form.fuel} />
      <input type="hidden" name="transmission" value={form.transmission} />
      <input type="hidden" name="location" value={form.location} />
      <input type="hidden" name="description" value={form.description} />
      <input type="hidden" name="photo_urls" value={form.photo_urls} />
      <input type="hidden" name="tour_360_url" value={form.tour_360_url} />
      <input
        type="hidden"
        name="walkthrough_video_url"
        value={form.walkthrough_video_url}
      />
      <input type="hidden" name="interior_vr_url" value={form.interior_vr_url} />
      <input type="hidden" name="ar_model_url" value={form.ar_model_url} />
      <input type="hidden" name="ar_ios_model_url" value={form.ar_ios_model_url} />

      <div className="dealer-wizard__steps" aria-label="Progress">
        <span className={step >= 1 ? "is-active" : ""}>1. Basic</span>
        <span className={step >= 2 ? "is-active" : ""}>2. Details</span>
        <span className={step >= 3 ? "is-active" : ""}>3. Photos</span>
      </div>

      {step === 1 && (
        <div className="dealer-wizard__card">
          <h3>Step 1: Basic info</h3>
          <p>Fill easy basics first.</p>
          <VoicePostHelper onApply={applyVoicePatch} />
          <div className="dealer-wizard__grid">
            <label>
              Type
              <select
                value={form.type}
                onChange={(event) => updateField("type", event.target.value)}
              >
                <option value="used">Used</option>
                <option value="new">New</option>
              </select>
            </label>
            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
              >
                <option value="available">Available</option>
                <option value="sold">Sold</option>
              </select>
            </label>
            <label>
              Make *
              <input
                value={form.make}
                onChange={(event) => updateField("make", event.target.value)}
                placeholder="e.g., Hyundai"
                required
              />
            </label>
            <label>
              Model *
              <input
                value={form.model}
                onChange={(event) => updateField("model", event.target.value)}
                placeholder="e.g., Creta"
                required
              />
            </label>
            <label>
              Variant
              <input
                value={form.variant}
                onChange={(event) => updateField("variant", event.target.value)}
                placeholder="e.g., SX"
              />
            </label>
            <label>
              Year
              <input
                type="number"
                inputMode="numeric"
                value={form.year}
                onChange={(event) => updateField("year", event.target.value)}
                placeholder="e.g., 2021"
              />
            </label>
            <label>
              Price
              <input
                type="number"
                inputMode="numeric"
                value={form.price}
                onChange={(event) => updateField("price", event.target.value)}
                placeholder="e.g., 950000"
              />
            </label>
            <label>
              City / Location
              <input
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                placeholder="e.g., Jalandhar"
              />
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="dealer-wizard__card">
          <h3>Step 2: Car details</h3>
          <p>Add driving and engine details.</p>
          <div className="dealer-wizard__grid">
            <label>
              Kilometers
              <input
                type="number"
                inputMode="numeric"
                value={form.km}
                onChange={(event) => updateField("km", event.target.value)}
                placeholder="e.g., 42000"
              />
            </label>
            <label>
              Fuel
              <input
                value={form.fuel}
                onChange={(event) => updateField("fuel", event.target.value)}
                placeholder="e.g., Petrol"
              />
            </label>
            <label>
              Transmission
              <input
                value={form.transmission}
                onChange={(event) =>
                  updateField("transmission", event.target.value)
                }
                placeholder="e.g., Automatic"
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Condition, service history, owner details..."
            />
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="dealer-wizard__card">
          <h3>Step 3: Photos and review</h3>
          <p>Paste photo links and check summary before posting.</p>
          <label>
            Photo URLs (one per line)
            <textarea
              rows={5}
              value={form.photo_urls}
              onChange={(event) => updateField("photo_urls", event.target.value)}
              placeholder="https://example.com/photo1.jpg"
            />
          </label>
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
              Tap to open gallery or camera on mobile.
            </span>
          </label>
          <div className="dealer-wizard__grid">
            <label>
              360 tour link (optional)
              <input
                value={form.tour_360_url}
                onChange={(event) => updateField("tour_360_url", event.target.value)}
                placeholder="YouTube / Meta 360 link"
              />
            </label>
            <label>
              Walkthrough video link
              <input
                value={form.walkthrough_video_url}
                onChange={(event) =>
                  updateField("walkthrough_video_url", event.target.value)
                }
                placeholder="YouTube / MP4 link"
              />
            </label>
            <label>
              Interior VR link
              <input
                value={form.interior_vr_url}
                onChange={(event) => updateField("interior_vr_url", event.target.value)}
                placeholder="VR headset tour link"
              />
            </label>
            <label>
              AR model (.glb)
              <input
                value={form.ar_model_url}
                onChange={(event) => updateField("ar_model_url", event.target.value)}
                placeholder="https://.../model.glb"
              />
            </label>
            <label>
              AR iOS model (.usdz)
              <input
                value={form.ar_ios_model_url}
                onChange={(event) => updateField("ar_ios_model_url", event.target.value)}
                placeholder="https://.../model.usdz"
              />
            </label>
          </div>

          <div className="dealer-wizard__summary">
            <p>
              <strong>Car:</strong> {form.year || "--"} {form.make || "--"}{" "}
              {form.model || "--"} {form.variant || ""}
            </p>
            <p>
              <strong>Price:</strong> {formatPrice(form.price)}
            </p>
            <p>
              <strong>Location:</strong> {form.location || "Not set"}
            </p>
            <p>
              <strong>Photos:</strong> {photoCount}
            </p>
          </div>
        </div>
      )}

      {error && <p className="dealer-wizard__error">{error}</p>}

      <div className="dealer-wizard__actions">
        {step > 1 && (
          <button className="btn btn--ghost" type="button" onClick={goBack}>
            Back
          </button>
        )}
        {step < 3 ? (
          <button className="btn btn--solid" type="button" onClick={goNext}>
            Next
          </button>
        ) : (
          <button className="btn btn--solid" type="submit">
            {submitLabel}
          </button>
        )}
      </div>
    </form>
  );
}
