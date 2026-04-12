"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadCarImagesFromClient } from "@/lib/clientCarImageUpload";

type ListingFormState = {
  listingType: "dealer" | "private";
  sellerName: string;
  sellerPhone: string;
  make: string;
  model: string;
  variant: string;
  year: string;
  fuel: string;
  transmission: string;
  kmDriven: string;
  ownership: string;
  price: string;
  location: string;
  exteriorColor: string;
  registrationYear: string;
  registrationState: string;
  insuranceStatus: string;
  fitnessStatus: string;
  description: string;
  featured: boolean;
  status: "draft" | "available" | "sold" | "archived";
};

const emptyState: ListingFormState = {
  listingType: "dealer",
  sellerName: "",
  sellerPhone: "",
  make: "",
  model: "",
  variant: "",
  year: "",
  fuel: "",
  transmission: "",
  kmDriven: "",
  ownership: "",
  price: "",
  location: "",
  exteriorColor: "",
  registrationYear: "",
  registrationState: "",
  insuranceStatus: "",
  fitnessStatus: "",
  description: "",
  featured: false,
  status: "draft",
};

type Props = {
  mode: "create" | "edit";
  initialId?: string;
  initial?: Partial<ListingFormState>;
  initialPhotos?: string[];
};

export default function ListingWizard({
  mode,
  initialId,
  initial,
  initialPhotos,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ListingFormState>({
    ...emptyState,
    ...(initial ?? {}),
  });
  const [listingId, setListingId] = useState(initialId ?? "");
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialPhotos ?? []);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [autoSaved, setAutoSaved] = useState<string | null>(null);

  const totalPhotos = photoUrls.length + photoFiles.length;

  const handleChange = (field: keyof ListingFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const uploadPhotos = async () => {
    if (photoFiles.length === 0) return [];
    return uploadCarImagesFromClient(photoFiles, `admin-app/${Date.now()}`);
  };

  const movePhoto = (from: number, to: number) => {
    setPhotoUrls((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, idx) => idx !== index));
    if (coverIndex === index) {
      setCoverIndex(0);
    }
  };

  const saveListing = async (nextStatus?: ListingFormState["status"]) => {
    setSaving(true);
    setMessage(null);
    try {
      const uploadedUrls = await uploadPhotos();
      const mergedUrls = [...photoUrls, ...uploadedUrls];
      const payload = {
        id: listingId || undefined,
        listingType: form.listingType,
        sellerName: form.sellerName,
        sellerPhone: form.sellerPhone,
        make: form.make,
        model: form.model,
        variant: form.variant,
        year: form.year,
        fuel: form.fuel,
        transmission: form.transmission,
        kmDriven: form.kmDriven,
        ownership: form.ownership,
        price: form.price,
        location: form.location,
        exteriorColor: form.exteriorColor,
        registrationYear: form.registrationYear,
        registrationState: form.registrationState,
        insuranceStatus: form.insuranceStatus,
        fitnessStatus: form.fitnessStatus,
        description: form.description,
        featured: form.featured,
        status: nextStatus ?? form.status,
        photoUrls: mergedUrls,
        coverIndex,
      };
      const response = await fetch("/api/admin-app/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body?.ok) {
        throw new Error(body?.error || "Could not save listing.");
      }
      if (!listingId) {
        setListingId(body.id);
      }
      setPhotoUrls(mergedUrls);
      setPhotoFiles([]);
      setMessage("Saved.");
      if (nextStatus === "available") {
        router.push(`/admin-app/listings/${body.id}/preview`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save listing.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!listingId) return;
    const timer = setTimeout(() => {
      saveListing("draft").then(() => setAutoSaved("Draft autosaved"));
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, photoUrls, coverIndex]);

  const previewTitle = useMemo(
    () =>
      [form.year, form.make, form.model, form.variant]
        .filter(Boolean)
        .join(" ") || "Preview listing",
    [form.year, form.make, form.model, form.variant]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[1, 2, 3].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStep(idx)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                step === idx ? "bg-black text-white" : "border border-slate-200"
              }`}
            >
              Step {idx}
            </button>
          ))}
        </div>
        {autoSaved && (
          <span className="text-xs text-slate-400">{autoSaved}</span>
        )}
      </div>

      {message ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {message}
        </div>
      ) : null}

      {step === 1 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-600">
            Listing type
            <select
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={form.listingType}
              onChange={(event) =>
                handleChange("listingType", event.target.value as "dealer" | "private")
              }
            >
              <option value="dealer">Dealer</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Seller / Dealer name
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.sellerName}
              onChange={(event) => handleChange("sellerName", event.target.value)}
              placeholder="Dealer or seller name"
            />
          </label>
          <label className="text-sm text-slate-600">
            Seller phone
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.sellerPhone}
              onChange={(event) => handleChange("sellerPhone", event.target.value)}
              placeholder="Phone number"
            />
          </label>
          <label className="text-sm text-slate-600">
            Make
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.make}
              onChange={(event) => handleChange("make", event.target.value)}
              placeholder="Toyota"
            />
          </label>
          <label className="text-sm text-slate-600">
            Model
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.model}
              onChange={(event) => handleChange("model", event.target.value)}
              placeholder="Innova Crysta"
            />
          </label>
          <label className="text-sm text-slate-600">
            Variant
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.variant}
              onChange={(event) => handleChange("variant", event.target.value)}
              placeholder="ZX"
            />
          </label>
          <label className="text-sm text-slate-600">
            Year
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.year}
              onChange={(event) => handleChange("year", event.target.value)}
              placeholder="2022"
            />
          </label>
          <label className="text-sm text-slate-600">
            Fuel
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.fuel}
              onChange={(event) => handleChange("fuel", event.target.value)}
              placeholder="Diesel"
            />
          </label>
          <label className="text-sm text-slate-600">
            Transmission
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.transmission}
              onChange={(event) => handleChange("transmission", event.target.value)}
              placeholder="Manual"
            />
          </label>
          <label className="text-sm text-slate-600">
            KM driven
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.kmDriven}
              onChange={(event) => handleChange("kmDriven", event.target.value)}
              placeholder="65000"
            />
          </label>
          <label className="text-sm text-slate-600">
            Ownership
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.ownership}
              onChange={(event) => handleChange("ownership", event.target.value)}
              placeholder="1st owner"
            />
          </label>
          <label className="text-sm text-slate-600">
            Price
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.price}
              onChange={(event) => handleChange("price", event.target.value)}
              placeholder="17.8 lakh"
            />
          </label>
          <label className="text-sm text-slate-600">
            Location
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.location}
              onChange={(event) => handleChange("location", event.target.value)}
              placeholder="Jalandhar"
            />
          </label>
          <label className="text-sm text-slate-600">
            Exterior color
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.exteriorColor}
              onChange={(event) => handleChange("exteriorColor", event.target.value)}
              placeholder="White"
            />
          </label>
          <label className="text-sm text-slate-600">
            Registration year
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.registrationYear}
              onChange={(event) => handleChange("registrationYear", event.target.value)}
              placeholder="2022"
            />
          </label>
          <label className="text-sm text-slate-600">
            Registration state
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.registrationState}
              onChange={(event) =>
                handleChange("registrationState", event.target.value)
              }
              placeholder="PB"
            />
          </label>
          <label className="text-sm text-slate-600">
            Insurance status
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.insuranceStatus}
              onChange={(event) =>
                handleChange("insuranceStatus", event.target.value)
              }
              placeholder="Valid till Dec 2026"
            />
          </label>
          <label className="text-sm text-slate-600">
            Fitness / passing
            <input
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.fitnessStatus}
              onChange={(event) =>
                handleChange("fitnessStatus", event.target.value)
              }
              placeholder="Valid"
            />
          </label>
          <label className="text-sm text-slate-600 sm:col-span-2">
            Description
            <textarea
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              rows={4}
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
              placeholder="Clean interior, single owner, service history..."
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) => handleChange("featured", event.target.checked)}
            />
            Featured listing
          </label>
          <label className="text-sm text-slate-600">
            Status
            <select
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
              value={form.status}
              onChange={(event) =>
                handleChange(
                  "status",
                  event.target.value as ListingFormState["status"]
                )
              }
            >
              <option value="draft">Draft</option>
              <option value="available">Published</option>
              <option value="sold">Sold</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Upload photos
            <input
              type="file"
              multiple
              accept="image/*"
              className="mt-2 block w-full rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm"
              onChange={(event) =>
                setPhotoFiles(Array.from(event.target.files ?? []))
              }
            />
          </label>
          <p className="text-xs text-slate-500">
            {totalPhotos} photos selected. Set cover and reorder as needed.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photoUrls.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-3"
              >
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="h-40 w-full rounded-xl object-cover"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCoverIndex(index)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      coverIndex === index
                        ? "bg-black text-white"
                        : "border border-slate-200 text-slate-600"
                    }`}
                  >
                    {coverIndex === index ? "Cover" : "Set cover"}
                  </button>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => movePhoto(index, index - 1)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
                    >
                      Up
                    </button>
                  )}
                  {index < photoUrls.length - 1 && (
                    <button
                      type="button"
                      onClick={() => movePhoto(index, index + 1)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
                    >
                      Down
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6 rounded-2xl border border-slate-200 p-4">
          <h3 className="text-lg font-semibold text-slate-900">Preview</h3>
          <p className="text-sm text-slate-600">
            {previewTitle} · {form.location || "Location pending"}
          </p>
          {photoUrls[coverIndex] && (
            <img
              src={photoUrls[coverIndex]}
              alt={previewTitle}
              className="mt-4 h-56 w-full rounded-2xl object-cover"
            />
          )}
          <div className="mt-4 text-sm text-slate-600">
            <p>{form.description || "No description yet."}</p>
            <p className="mt-2">
              Price: <span className="font-semibold text-slate-900">{form.price || "TBD"}</span>
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
          onClick={() => setStep((prev) => Math.max(1, prev - 1))}
        >
          Back
        </button>
        <button
          type="button"
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
          onClick={() => setStep((prev) => Math.min(3, prev + 1))}
        >
          Next
        </button>
        <button
          type="button"
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
          onClick={() => saveListing("draft")}
          disabled={saving}
        >
          Save draft
        </button>
        <button
          type="button"
          className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white"
          onClick={() => saveListing("available")}
          disabled={saving}
        >
          Publish
        </button>
      </div>
    </div>
  );
}
