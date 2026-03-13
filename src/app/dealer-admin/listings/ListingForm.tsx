"use client";

import { FormEvent, useMemo, useState } from "react";
import { uploadCarImagesFromClient } from "@/lib/clientCarImageUpload";
import { parseIndianMoney } from "@/lib/parseIndianMoney";

type ListingFormData = {
  id?: string;
  type?: string | null;
  make?: string | null;
  model?: string | null;
  variant?: string | null;
  year?: number | null;
  km?: number | null;
  fuel?: string | null;
  transmission?: string | null;
  price?: number | null;
  location?: string | null;
  description?: string | null;
  status?: string | null;
  photo_urls?: string[] | null;
  tour_360_url?: string | null;
  walkthrough_video_url?: string | null;
  interior_vr_url?: string | null;
  ar_model_url?: string | null;
  ar_ios_model_url?: string | null;
};

type Props = {
  listing?: ListingFormData | null;
  action: string;
  submitLabel: string;
};

type FormState = {
  type: string;
  status: string;
  make: string;
  model: string;
  variant: string;
  year: string;
  km: string;
  fuel: string;
  transmission: string;
  price: string;
  location: string;
  description: string;
  photoUrls: string;
  walkthroughVideoUrl: string;
};

const joinPhotos = (photos?: string[] | null) => photos?.join("\n") ?? "";

const buildInitialState = (listing?: ListingFormData | null): FormState => ({
  type: listing?.type ?? "used",
  status: listing?.status ?? "available",
  make: listing?.make ?? "",
  model: listing?.model ?? "",
  variant: listing?.variant ?? "",
  year: listing?.year ? String(listing.year) : "",
  km: listing?.km ? String(listing.km) : "",
  fuel: listing?.fuel ?? "",
  transmission: listing?.transmission ?? "",
  price: listing?.price ? String(listing.price) : "",
  location: listing?.location ?? "",
  description: listing?.description ?? "",
  photoUrls: joinPhotos(listing?.photo_urls),
  walkthroughVideoUrl: listing?.walkthrough_video_url ?? "",
});

export default function ListingForm({ listing, action, submitLabel }: Props) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(listing));
  const [selectedUploadCount, setSelectedUploadCount] = useState(0);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  const manualPhotoCount = useMemo(
    () =>
      form.photoUrls
        .split(/[\n,|]/)
        .map((item) => item.trim())
        .filter(Boolean).length,
    [form.photoUrls]
  );

  const totalPhotoCount = manualPhotoCount + selectedUploadCount;
  const formattedPrice = useMemo(() => {
    const parsed = parseIndianMoney(form.price);
    return parsed ? `Rs ${parsed.toLocaleString("en-IN")}` : "Price not set";
  }, [form.price]);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (!form.make.trim() || !form.model.trim()) {
      setError("Please add make and model.");
      return;
    }

    if (totalPhotoCount < 1) {
      setError("Please add at least 1 photo.");
      return;
    }

    if (totalPhotoCount > 8) {
      setError("You can upload maximum 8 photos.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    setUploadProgress(null);

    try {
      const formData = new FormData(event.currentTarget);
      const uploadedFiles = formData
        .getAll("photo_files")
        .filter((entry): entry is File => typeof entry !== "string" && entry.size > 0);
      const uploadedUrls = await uploadCarImagesFromClient(
        uploadedFiles,
        `dealer/${listing?.id ?? Date.now()}`,
        (progress) => setUploadProgress(progress)
      );
      const manualPhotos = form.photoUrls
        .split(/[\n,|]/)
        .map((item) => item.trim())
        .filter(Boolean);

      formData.delete("photo_files");
      formData.set("photo_urls", [...manualPhotos, ...uploadedUrls].join("\n"));

      const response = await fetch(action, {
        method: "POST",
        body: formData,
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setError(payload?.error || "Could not save listing.");
        setIsSubmitting(false);
        setUploadProgress(null);
        return;
      }

      if (typeof window !== "undefined") {
        window.location.assign(payload.redirectTo || response.url);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not save listing."
      );
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <form className="dealer-form" onSubmit={handleSubmit} encType="multipart/form-data">
      <div className="dealer-form__grid">
        <label>
          Type
          <select name="type" value={form.type} onChange={(event) => updateField("type", event.target.value)}>
            <option value="used">Used</option>
            <option value="new">New</option>
          </select>
        </label>
        <label>
          Status
          <select
            name="status"
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
          >
            <option value="available">Available</option>
            <option value="sold">Sold</option>
          </select>
        </label>
        <label>
          Make
          <input name="make" value={form.make} onChange={(event) => updateField("make", event.target.value)} required />
        </label>
        <label>
          Model
          <input name="model" value={form.model} onChange={(event) => updateField("model", event.target.value)} required />
        </label>
        <label>
          Variant
          <input name="variant" value={form.variant} onChange={(event) => updateField("variant", event.target.value)} />
        </label>
        <label>
          Year
          <input name="year" type="number" value={form.year} onChange={(event) => updateField("year", event.target.value)} />
        </label>
        <label>
          Price
          <input name="price" type="text" value={form.price} onChange={(event) => updateField("price", event.target.value)} />
        </label>
        <label>
          Kilometers
          <input name="km" type="number" value={form.km} onChange={(event) => updateField("km", event.target.value)} />
        </label>
        <label>
          Fuel
          <input name="fuel" value={form.fuel} onChange={(event) => updateField("fuel", event.target.value)} />
        </label>
        <label>
          Transmission
          <input name="transmission" value={form.transmission} onChange={(event) => updateField("transmission", event.target.value)} />
        </label>
        <label>
          Location
          <input name="location" value={form.location} onChange={(event) => updateField("location", event.target.value)} />
        </label>
      </div>
      <label>
        Description
        <textarea
          name="description"
          rows={4}
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </label>
      <label>
        Photo URLs (one per line)
        <textarea
          name="photo_urls"
          rows={4}
          value={form.photoUrls}
          onChange={(event) => updateField("photoUrls", event.target.value)}
        />
      </label>
      <div className="dealer-form__grid">
        <label>
          Walkthrough video URL
          <input
            name="walkthrough_video_url"
            value={form.walkthroughVideoUrl}
            onChange={(event) => updateField("walkthroughVideoUrl", event.target.value)}
            placeholder="YouTube / MP4 / Instagram embed link"
          />
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
          onChange={(event) => setSelectedUploadCount(event.currentTarget.files?.length ?? 0)}
        />
        <span className="dealer-form__hint">
          On mobile this opens gallery/camera directly. Minimum 1 photo, maximum 8.
        </span>
      </label>
      {uploadProgress ? (
        <p className="dealer-form__hint">Uploading photos: {uploadProgress.done}/{uploadProgress.total}</p>
      ) : null}
      <div className="dealer-wizard__summary">
        <p>
          <strong>Price:</strong> {formattedPrice}
        </p>
        <p>
          <strong>Photos:</strong> {totalPhotoCount}
        </p>
      </div>
      {error ? <p className="dealer-wizard__error">{error}</p> : null}
      <button className="btn btn--solid" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Uploading photos..." : submitLabel}
      </button>
    </form>
  );
}
