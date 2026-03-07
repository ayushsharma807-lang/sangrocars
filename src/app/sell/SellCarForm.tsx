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
import { buildPolishedDescription } from "@/lib/descriptionPolisher";

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
  const [registration, setRegistration] = useState("");
  const [serviceHistory, setServiceHistory] = useState("Full service history");
  const [accidentHistory, setAccidentHistory] = useState("No accidents");

  const [notes, setNotes] = useState("");
  const [photoUrlsText, setPhotoUrlsText] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [sellerType, setSellerType] = useState("private");
  const [dealerName, setDealerName] = useState("");
  const [dealerLogo, setDealerLogo] = useState("");
  const [dealerProfile, setDealerProfile] = useState("");

  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const modelOptions = useMemo(() => getModelOptions(make), [make]);
  const variantOptions = useMemo(() => getVariantOptions(model), [model]);

  const photoUrls = useMemo(() => parsePhotoUrls(photoUrlsText), [photoUrlsText]);
  const totalPhotos = photoFiles.length + photoUrls.length;

  useEffect(() => {
    const urls = photoFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoFiles]);

  useEffect(() => {
    setPhoneVerified(false);
    setOtpCode("");
    setOtpMessage(null);
    setOtpError(null);
  }, [sellerPhone]);

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

  const polishDescription = () => {
    const polished = buildPolishedDescription({
      make,
      model,
      variant,
      year,
      price,
      km,
      fuel,
      transmission,
      location,
      notes,
    });
    if (polished) setNotes(polished);
  };

  const suggestedRange = useMemo(() => {
    if (!make || !model || !location) return null;
    const numericPrice = Number(price || 0);
    const base = Number.isFinite(numericPrice) && numericPrice > 0 ? numericPrice : 1_200_000;
    const min = Math.round(base * 0.9);
    const max = Math.round(base * 1.1);
    return { min, max };
  }, [make, model, location, price]);

  const formattedTitle = [year, make, model, variant].filter(Boolean).join(" ");
  const expectedViews = location ? "200–350" : "150–260";

  const compiledDescription = [
    `Owner type: ${ownerType}`,
    `Registration/RTO: ${registration || "Not provided"}`,
    `Service history: ${serviceHistory}`,
    `Accident history: ${accidentHistory}`,
    sellerType === "dealer" ? `Seller type: Dealer` : `Seller type: Private seller`,
    sellerType === "dealer" && dealerName ? `Dealership: ${dealerName}` : null,
    sellerType === "dealer" && dealerProfile ? `Dealer profile: ${dealerProfile}` : null,
    notes ? `Notes: ${notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const step1Ready = Boolean(make && model && year && price && km && fuel && transmission && location);
  const step2Ready = totalPhotos >= MIN_PHOTOS;
  const step3Ready = Boolean(sellerPhone && phoneVerified);

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

  const requestOtp = async () => {
    if (!sellerPhone) {
      setOtpError("Enter a phone number first.");
      return;
    }
    setOtpError(null);
    setOtpMessage(null);
    setOtpSending(true);
    const response = await fetch("/api/listings/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: sellerPhone }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    setOtpSending(false);
    if (!response?.ok || !payload?.ok) {
      setOtpError("Unable to send OTP. Please try again.");
      return;
    }
    setOtpMessage("OTP sent. Please check your phone.");
  };

  const verifyOtp = async () => {
    if (!sellerPhone || !otpCode) {
      setOtpError("Enter the OTP code.");
      return;
    }
    setOtpError(null);
    setOtpMessage(null);
    setOtpVerifying(true);
    const response = await fetch("/api/listings/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: sellerPhone, token: otpCode }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null);
    setOtpVerifying(false);
    if (!response?.ok || !payload?.ok) {
      setOtpError("OTP verification failed. Try again.");
      return;
    }
    setPhoneVerified(true);
    setOtpMessage("Phone verified. You can publish now.");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!step1Ready || !step2Ready || !step3Ready) {
      event.preventDefault();
      setFormError("Please complete all steps before publishing.");
      return;
    }
    setFormError(null);
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

      {step === 1 && (
        <section className="sell-step-panel">
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
                type="number"
                placeholder="e.g., 950000"
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
            <label>
              Registration / RTO
              <input
                name="registration"
                value={registration}
                onChange={(event) => setRegistration(event.target.value)}
                placeholder="PB08 / DL01 / HR26"
              />
            </label>
            <label>
              Service history
              <select
                name="service_history"
                value={serviceHistory}
                onChange={(event) => setServiceHistory(event.target.value)}
              >
                <option>Full service history</option>
                <option>Partial</option>
                <option>Not available</option>
              </select>
            </label>
            <label>
              Accident history
              <select
                name="accident_history"
                value={accidentHistory}
                onChange={(event) => setAccidentHistory(event.target.value)}
              >
                <option>No accidents</option>
                <option>Minor</option>
                <option>Major</option>
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
      )}

      {step === 2 && (
        <section className="sell-step-panel">
          <h3>Step 2 – Photos & description</h3>
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
          <label>
            Photo URLs (optional)
            <textarea
              name="photo_urls"
              rows={4}
              placeholder="https://example.com/photo1.jpg"
              value={photoUrlsText}
              onChange={(event) => setPhotoUrlsText(event.target.value)}
            />
          </label>
          <label>
            Walkthrough video URL (optional)
            <input
              name="walkthrough_video_url"
              placeholder="YouTube / MP4 / Instagram / Facebook embed link"
            />
          </label>
          <label>
            Description
            <textarea
              rows={5}
              placeholder="Example: Single owner car. All services done at Toyota service center. New tyres installed. Insurance valid till Dec 2025."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <div className="dealer-form__actions">
            <button
              className="simple-button simple-button--secondary"
              type="button"
              onClick={polishDescription}
            >
              Polish description
            </button>
          </div>
          <div className="dealer-form__grid">
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
        </section>
      )}

      {step === 3 && (
        <section className="sell-step-panel">
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
                <label>
                  Dealer logo URL
                  <input
                    name="dealer_logo"
                    value={dealerLogo}
                    onChange={(event) => setDealerLogo(event.target.value)}
                  />
                </label>
                <label>
                  Dealer profile link
                  <input
                    name="dealer_profile"
                    value={dealerProfile}
                    onChange={(event) => setDealerProfile(event.target.value)}
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
          <div className="sell-otp">
            <div className="sell-otp__row">
              <button
                type="button"
                className="simple-button simple-button--secondary"
                onClick={requestOtp}
                disabled={otpSending}
              >
                {otpSending ? "Sending OTP..." : "Send OTP"}
              </button>
              <input
                type="text"
                placeholder="Enter OTP"
                value={otpCode}
                onChange={(event) => setOtpCode(event.target.value)}
              />
              <button
                type="button"
                className="simple-button"
                onClick={verifyOtp}
                disabled={otpVerifying}
              >
                {otpVerifying ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
            {otpMessage && <p className="sell-otp__message">{otpMessage}</p>}
            {otpError && <p className="sell-otp__error">{otpError}</p>}
          </div>
          <div className="sell-hint">
            Your phone number is only shared with interested buyers. SangroCars does not charge listing fees.
          </div>
          <div className="sell-hint">
            Based on similar listings in {location || "your city"}: Expected views per week: {expectedViews}
          </div>
          <label className="sell-check">
            <input type="checkbox" /> Boost your listing (Featured for 7 days • ₹299)
          </label>
          <div className="sell-preview-actions">
            <button
              type="button"
              className="simple-button simple-button--secondary"
              onClick={() => setShowPreview((prev) => !prev)}
            >
              {showPreview ? "Hide preview" : "Preview listing"}
            </button>
          </div>
          {showPreview && (
            <div className="sell-preview">
              <h4>Preview</h4>
              <div className="sell-preview__card">
                {photoPreviews[0] ? (
                  <img src={photoPreviews[0]} alt="Preview" />
                ) : (
                  <div className="sell-preview__placeholder">No photos yet</div>
                )}
                <div>
                  <h3>{formattedTitle || "Your car"}</h3>
                  <p>{location || "Location"}</p>
                  <strong>{price ? `₹${Number(price).toLocaleString("en-IN")}` : "Price"}</strong>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

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
          <button className="simple-button sell-form__submit" type="submit">
            List my car for sale
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
