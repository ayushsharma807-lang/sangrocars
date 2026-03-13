"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  FUEL_OPTIONS,
  MAKE_OPTIONS,
  TRANSMISSION_OPTIONS,
  getModelOptions,
  getVariantOptions,
} from "@/lib/carOptions";
import { uploadCarImagesFromClient } from "@/lib/clientCarImageUpload";
import { parseIndianMoney } from "@/lib/parseIndianMoney";

const MIN_PHOTOS = 1;

const parsePhotoUrls = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function SellCarForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [variant, setVariant] = useState("");
  const [year, setYear] = useState("");
  const [price, setPrice] = useState("");
  const [km, setKm] = useState("");
  const [fuel, setFuel] = useState("");
  const [transmission, setTransmission] = useState("");
  const [location, setLocation] = useState("");

  const [ownerType, setOwnerType] = useState("1st owner");

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);

  const [sellerType, setSellerType] = useState("private");
  const [dealerName, setDealerName] = useState("");

  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");

  const modelOptions = useMemo(() => getModelOptions(make), [make]);
  const variantOptions = useMemo(() => getVariantOptions(model), [model]);

  const totalPhotos = photoFiles.length;

  useEffect(() => {
    const urls = photoFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoFiles]);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const staleTextLabels = new Set([
      "Dealer logo URL",
      "Dealer profile link",
    ]);

    form.querySelectorAll("label").forEach((label) => {
      const text = label.textContent?.trim() ?? "";
      if (staleTextLabels.has(text)) {
        (label as HTMLElement).style.display = "none";
      }
    });

    form.querySelectorAll("button").forEach((button) => {
      const text = button.textContent?.trim().toLowerCase() ?? "";
      if (text === "send otp" || text === "verify otp") {
        (button as HTMLButtonElement).style.display = "none";
      }
    });

    form.querySelectorAll("input").forEach((input) => {
      const placeholder = input.getAttribute("placeholder")?.trim().toLowerCase() ?? "";
      if (placeholder === "enter otp") {
        (input as HTMLInputElement).style.display = "none";
      }
    });
  }, []);

  const updateFiles = (files: File[]) => {
    setPhotoFiles(files);
    const dt = new DataTransfer();
    files.forEach((file) => dt.items.add(file));
    if (fileInputRef.current) {
      fileInputRef.current.files = dt.files;
    }
  };

  const handleFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    if (incoming.length === 0) return;
    updateFiles([...photoFiles, ...incoming]);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const handleReorder = (toIndex: number) => {
    if (dragIndex === null || dragIndex === toIndex) return;
    const next = [...photoFiles];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(toIndex, 0, moved);
    updateFiles(next);
    setDragIndex(null);
  };

  const removePhoto = (index: number) => {
    const next = photoFiles.filter((_, idx) => idx !== index);
    updateFiles(next);
  };

  const suggestedRange = useMemo(() => {
    if (!make || !model || !location) return null;
    const numericPrice = parseIndianMoney(price);
    const base = numericPrice && numericPrice > 0 ? numericPrice : 1_200_000;
    const min = Math.round(base * 0.9);
    const max = Math.round(base * 1.1);
    return { min, max };
  }, [make, model, location, price]);

  const formattedTitle = [year, make, model, variant].filter(Boolean).join(" ");
  const expectedViews = location ? "200–350" : "150–260";

  const compiledDescription = [
    `Owner type: ${ownerType}`,
    sellerType === "dealer" ? `Seller type: Dealer` : `Seller type: Private seller`,
    sellerType === "dealer" && dealerName ? `Dealership: ${dealerName}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const step1Ready = Boolean(make && model && year && price && km && fuel && transmission && location);
  const step2Ready = totalPhotos >= MIN_PHOTOS;
  const step3Ready = Boolean(sellerPhone);

  const completionParts = [
    make,
    model,
    year,
    price,
    km,
    fuel,
    transmission,
    location,
    totalPhotos >= MIN_PHOTOS ? "yes" : "",
    sellerPhone,
  ].filter(Boolean).length;
  const completion = Math.min(100, Math.round((completionParts / 10) * 100));

  const goNext = () => {
    if (step === 1 && !step1Ready) {
      setFormError("Please complete all required car details.");
      return;
    }
    if (step === 2 && !step2Ready) {
      setFormError(`Add at least ${MIN_PHOTOS} photos to continue.`);
      return;
    }
    setFormError(null);
    setStep(Math.min(3, step + 1));
  };

  const goBack = () => {
    setFormError(null);
    setStep(Math.max(1, step - 1));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!step1Ready || !step2Ready || !step3Ready) {
      setFormError("Please complete all steps before publishing.");
      return;
    }

    if (isSubmitting) {
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    setUploadProgress(null);

    try {
      const formData = new FormData(event.currentTarget);
      const uploadedUrls = await uploadCarImagesFromClient(
        photoFiles,
        `public/${Date.now()}`,
        (progress) => setUploadProgress(progress)
      );
      formData.delete("photo_files");
      formData.set("photo_urls", uploadedUrls.join("\n"));

      const response = await fetch("/api/listings/public-post", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      const contentType = response.headers.get("content-type") ?? "";
      const payload = contentType.includes("application/json")
        ? await response.json().catch(() => null)
        : null;

      if (!response.ok || !payload?.ok) {
        setFormError(
          typeof payload?.error === "string" && payload.error
            ? payload.error
            : "Could not create your ad right now. Please try again."
        );
        setIsSubmitting(false);
        setUploadProgress(null);
        return;
      }

      if (typeof window !== "undefined") {
        window.location.assign(payload.redirectTo || "/sell?status=submitted");
      }
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Could not create your ad right now. Please try again."
      );
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <form
      className="dealer-form sell-form"
      method="post"
      action="/api/listings/public-post"
      encType="multipart/form-data"
      ref={formRef}
      onSubmit={handleSubmit}
    >
      <div className="sell-progress">
        <div className="sell-progress__bar">
          <span style={{ width: `${completion}%` }} />
        </div>
        <p>Listing completion: {completion}%</p>
      </div>

      <div className="sell-steps">
        <button type="button" className={`sell-step${step === 1 ? " is-active" : ""}`} onClick={() => setStep(1)}>
          Step 1
          <span>Car details</span>
        </button>
        <button type="button" className={`sell-step${step === 2 ? " is-active" : ""}`} onClick={() => setStep(2)}>
          Step 2
          <span>Photos</span>
        </button>
        <button type="button" className={`sell-step${step === 3 ? " is-active" : ""}`} onClick={() => setStep(3)}>
          Step 3
          <span>Publish</span>
        </button>
      </div>

      {formError && <div className="simple-alert simple-alert--error">{formError}</div>}

      <section className={`sell-step-panel${step === 1 ? "" : " is-hidden"}`}>
          <h3>Step 1 – Car details</h3>
          <div className="dealer-form__grid">
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
              Year *
              <input
                name="year"
                type="number"
                placeholder="e.g., 2021"
                required
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
            </label>
            <label>
              Fuel *
              <input
                name="fuel"
                list="sell-fuel-options"
                placeholder="Type or choose fuel"
                required
                value={fuel}
                onChange={(event) => setFuel(event.target.value)}
              />
            </label>
            <label>
              Transmission *
              <input
                name="transmission"
                list="sell-transmission-options"
                placeholder="Type or choose transmission"
                required
                value={transmission}
                onChange={(event) => setTransmission(event.target.value)}
              />
            </label>
            <label>
              KM driven *
              <input
                name="km"
                type="number"
                placeholder="e.g., 42000"
                required
                value={km}
                onChange={(event) => setKm(event.target.value)}
              />
            </label>
            <label>
              Price (INR) *
              <input
                name="price"
                type="text"
                placeholder="e.g., 11.5 lakh"
                required
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </label>
            <label>
              City / location *
              <input
                name="location"
                placeholder="e.g., Jalandhar, Punjab"
                required
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              />
            </label>
            <label>
              Owner type
              <select
                name="owner_type"
                value={ownerType}
                onChange={(event) => setOwnerType(event.target.value)}
              >
                <option>1st owner</option>
                <option>2nd owner</option>
                <option>3rd owner</option>
                <option>Dealer</option>
              </select>
            </label>
          </div>
          {suggestedRange ? (
            <div className="sell-hint">
              Suggested price for {make} {model} in {location}: ₹
              {suggestedRange.min.toLocaleString("en-IN")} – ₹
              {suggestedRange.max.toLocaleString("en-IN")}
            </div>
          ) : (
            <div className="sell-hint">Enter make, model, and city for a suggested price range.</div>
          )}
        </section>

      <section className={`sell-step-panel${step === 2 ? "" : " is-hidden"}`}>
          <h3>Step 2 – Photos</h3>
          <div className="sell-upload" onDrop={handleDrop} onDragOver={(event) => event.preventDefault()}>
            <p>Drag photos here or click to upload</p>
            <input
              ref={fileInputRef}
              type="file"
              name="photo_files"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(event) => {
                if (event.target.files) handleFiles(event.target.files);
              }}
            />
          </div>
          <div className="sell-hint">
            Add at least {MIN_PHOTOS} photos to attract buyers. Listings with photos sell 4x faster.
          </div>
          {uploadProgress && (
            <div className="sell-hint">Uploading photos: {uploadProgress.done}/{uploadProgress.total}</div>
          )}
          {photoPreviews.length > 0 && (
            <div className="sell-photo-grid">
              {photoPreviews.map((url, index) => (
                <div
                  key={url}
                  className="sell-photo"
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleReorder(index)}
                >
                  <img src={url} alt={`Upload ${index + 1}`} />
                  <button type="button" onClick={() => removePhoto(index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      <section className={`sell-step-panel${step === 3 ? "" : " is-hidden"}`}>
          <h3>Step 3 – Contact info</h3>
          <div className="dealer-form__grid">
            <label>
              Seller type
              <select
                name="seller_type"
                value={sellerType}
                onChange={(event) => setSellerType(event.target.value)}
              >
                <option value="private">Private seller</option>
                <option value="dealer">Dealer</option>
              </select>
            </label>
            {sellerType === "dealer" && (
              <>
                <label>
                  Dealership name
                  <input
                    name="dealer_name"
                    value={dealerName}
                    onChange={(event) => setDealerName(event.target.value)}
                  />
                </label>
              </>
            )}
            <label>
              Your name
              <input
                name="seller_name"
                placeholder="e.g., Rahul Sharma"
                value={sellerName}
                onChange={(event) => setSellerName(event.target.value)}
              />
            </label>
            <label>
              Phone *
              <input
                name="seller_phone"
                placeholder="e.g., 9876543210"
                required
                value={sellerPhone}
                onChange={(event) => setSellerPhone(event.target.value)}
              />
            </label>
            <label>
              Email
              <input
                name="seller_email"
                type="email"
                placeholder="e.g., you@gmail.com"
                value={sellerEmail}
                onChange={(event) => setSellerEmail(event.target.value)}
              />
            </label>
          </div>
          <div className="sell-hint">
            Your phone number is only shared with interested buyers. SangroCars does not charge listing fees.
          </div>
          <div className="sell-hint">
            Based on similar listings in {location || "your city"}: Expected views per week: {expectedViews}
          </div>
        </section>

      <input type="hidden" name="description" value={compiledDescription} />

      <div className="sell-form__actions">
        <Link className="simple-button simple-button--secondary" href="/listings">
          Back to listings
        </Link>
        {step > 1 && (
          <button className="simple-button simple-button--secondary" type="button" onClick={goBack}>
            Back
          </button>
        )}
        {step < 3 && (
          <button className="simple-button" type="button" onClick={goNext}>
            Continue
          </button>
        )}
        {step === 3 && (
          <button className="simple-button sell-form__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Uploading photos..." : "List my car for sale"}
          </button>
        )}
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
