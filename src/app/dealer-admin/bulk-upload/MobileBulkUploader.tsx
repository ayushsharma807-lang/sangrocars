"use client";

import { useMemo, useState } from "react";

const FUEL_OPTIONS = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];
const TRANSMISSION_OPTIONS = ["Manual", "Automatic"];

type BulkItem = {
  id: string;
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
  photos: File[];
};

type SubmitResult = {
  id: string;
  ok: boolean;
  title: string;
  message: string;
};

const createItem = (): BulkItem => ({
  id: crypto.randomUUID(),
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
  photos: [],
});

const buildTitle = (item: BulkItem) =>
  [item.year, item.make, item.model, item.variant].filter(Boolean).join(" ") || "Untitled car";

const validateItem = (item: BulkItem) => {
  if (!item.make.trim() || !item.model.trim()) {
    return "Make and model are required.";
  }
  if (!item.location.trim()) {
    return "City / location is required.";
  }
  if (item.photos.length < 1) {
    return "Add at least 1 photo.";
  }
  if (item.photos.length > 8) {
    return "Use maximum 8 photos per car.";
  }
  return null;
};

export default function MobileBulkUploader() {
  const [items, setItems] = useState<BulkItem[]>([createItem()]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [results, setResults] = useState<SubmitResult[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const totalPhotos = useMemo(
    () => items.reduce((count, item) => count + item.photos.length, 0),
    [items]
  );

  const updateItem = (id: string, field: keyof Omit<BulkItem, "id" | "photos">, value: string) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const updatePhotos = (id: string, files: FileList | null) => {
    const nextPhotos = Array.from(files ?? []).slice(0, 8);
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, photos: nextPhotos } : item))
    );
  };

  const addCar = () => {
    setItems((current) => [...current, createItem()]);
  };

  const duplicateCar = (id: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (!target) return current;
      return [
        ...current,
        {
          ...target,
          id: crypto.randomUUID(),
          photos: [],
        },
      ];
    });
  };

  const removeCar = (id: string) => {
    setItems((current) => {
      if (current.length === 1) {
        return [createItem()];
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const resetAll = () => {
    setItems([createItem()]);
    setResults([]);
    setSubmitError(null);
    setProgress({ done: 0, total: 0 });
  };

  const submitAll = async () => {
    setSubmitError(null);
    setResults([]);

    for (const item of items) {
      const message = validateItem(item);
      if (message) {
        setSubmitError(`${buildTitle(item)}: ${message}`);
        return;
      }
    }

    setIsSubmitting(true);
    setProgress({ done: 0, total: items.length });

    const nextResults: SubmitResult[] = [];

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const formData = new FormData();
      formData.set("type", "used");
      formData.set("make", item.make.trim());
      formData.set("model", item.model.trim());
      formData.set("variant", item.variant.trim());
      formData.set("year", item.year.trim());
      formData.set("price", item.price.trim());
      formData.set("km", item.km.trim());
      formData.set("fuel", item.fuel.trim());
      formData.set("transmission", item.transmission.trim());
      formData.set("location", item.location.trim());
      formData.set("description", item.description.trim());
      item.photos.forEach((file) => {
        formData.append("photo_files", file);
      });

      try {
        const response = await fetch("/api/dealer/listings", {
          method: "POST",
          headers: {
            "x-requested-with": "XMLHttpRequest",
            accept: "application/json",
          },
          body: formData,
        });
        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.ok) {
          nextResults.push({
            id: item.id,
            ok: false,
            title: buildTitle(item),
            message: payload?.error || "Could not save listing.",
          });
        } else {
          nextResults.push({
            id: item.id,
            ok: true,
            title: buildTitle(item),
            message: "Saved and sent for approval.",
          });
        }
      } catch (error) {
        nextResults.push({
          id: item.id,
          ok: false,
          title: buildTitle(item),
          message: error instanceof Error ? error.message : "Network error.",
        });
      }

      setProgress({ done: index + 1, total: items.length });
      setResults([...nextResults]);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="dealer-bulk-mobile">
      <section className="dealer-bulk-mobile__intro">
        <h3>Bulk upload from phone</h3>
        <p>
          Add many cars in one screen, upload gallery photos, and send all cars for
          approval together.
        </p>
        <div className="dealer-bulk-mobile__stats">
          <span>{items.length} cars in this batch</span>
          <span>{totalPhotos} photos selected</span>
          <span>1 to 8 photos per car</span>
        </div>
      </section>

      <section className="dealer-bulk-mobile__actions">
        <button className="btn btn--outline" type="button" onClick={addCar}>
          Add another car
        </button>
        <button
          className="btn btn--ghost"
          type="button"
          onClick={resetAll}
          disabled={isSubmitting}
        >
          Reset batch
        </button>
        <button
          className="btn btn--solid"
          type="button"
          onClick={submitAll}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? `Uploading ${progress.done}/${progress.total}`
            : "Upload all cars"}
        </button>
      </section>

      {submitError ? <div className="simple-alert">{submitError}</div> : null}

      <div className="dealer-bulk-mobile__list">
        {items.map((item, index) => (
          <section className="dealer-bulk-mobile__card" key={item.id}>
            <div className="dealer-bulk-mobile__card-head">
              <div>
                <h3>Car {index + 1}</h3>
                <p>{buildTitle(item)}</p>
              </div>
              <div className="dealer-bulk-mobile__actions">
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => duplicateCar(item.id)}
                  disabled={isSubmitting}
                >
                  Duplicate
                </button>
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => removeCar(item.id)}
                  disabled={isSubmitting}
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="dealer-bulk-mobile__grid">
              <label>
                Make *
                <input
                  name={`make-${item.id}`}
                  value={item.make}
                  onChange={(event) => updateItem(item.id, "make", event.target.value)}
                  placeholder="Hyundai"
                />
              </label>
              <label>
                Model *
                <input
                  name={`model-${item.id}`}
                  value={item.model}
                  onChange={(event) => updateItem(item.id, "model", event.target.value)}
                  placeholder="Creta"
                />
              </label>
              <label>
                Variant
                <input
                  name={`variant-${item.id}`}
                  value={item.variant}
                  onChange={(event) => updateItem(item.id, "variant", event.target.value)}
                  placeholder="SX"
                />
              </label>
              <label>
                Year
                <input
                  name={`year-${item.id}`}
                  value={item.year}
                  onChange={(event) => updateItem(item.id, "year", event.target.value)}
                  inputMode="numeric"
                  placeholder="2022"
                />
              </label>
              <label>
                Price
                <input
                  name={`price-${item.id}`}
                  value={item.price}
                  onChange={(event) => updateItem(item.id, "price", event.target.value)}
                  placeholder="11.5 lakh"
                />
              </label>
              <label>
                KM driven
                <input
                  name={`km-${item.id}`}
                  value={item.km}
                  onChange={(event) => updateItem(item.id, "km", event.target.value)}
                  inputMode="numeric"
                  placeholder="42000"
                />
              </label>
              <label>
                Fuel
                <div className="dealer-bulk-mobile__choice-group">
                  {FUEL_OPTIONS.map((option) => (
                    <button
                      key={option}
                      className={
                        item.fuel === option
                          ? "dealer-bulk-mobile__choice is-active"
                          : "dealer-bulk-mobile__choice"
                      }
                      type="button"
                      onClick={() => updateItem(item.id, "fuel", option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </label>
              <label>
                Transmission
                <div className="dealer-bulk-mobile__choice-group">
                  {TRANSMISSION_OPTIONS.map((option) => (
                    <button
                      key={option}
                      className={
                        item.transmission === option
                          ? "dealer-bulk-mobile__choice is-active"
                          : "dealer-bulk-mobile__choice"
                      }
                      type="button"
                      onClick={() => updateItem(item.id, "transmission", option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </label>
              <label className="dealer-bulk-mobile__full">
                City / location *
                <input
                  name={`location-${item.id}`}
                  value={item.location}
                  onChange={(event) => updateItem(item.id, "location", event.target.value)}
                  placeholder="Jalandhar"
                />
              </label>
              <label className="dealer-bulk-mobile__full">
                Notes (optional)
                <textarea
                  name={`description-${item.id}`}
                  value={item.description}
                  onChange={(event) => updateItem(item.id, "description", event.target.value)}
                  placeholder="Single owner. Finance available."
                  rows={3}
                />
              </label>
              <label className="dealer-bulk-mobile__full">
                Photos *
                <input
                  name={`photos-${item.id}`}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  onChange={(event) => updatePhotos(item.id, event.target.files)}
                />
                <small>
                  {item.photos.length} selected. Minimum 1, maximum 8 photos.
                </small>
              </label>
            </div>
          </section>
        ))}
      </div>

      {results.length > 0 ? (
        <section className="dealer-bulk-mobile__results">
          <h3>Upload results</h3>
          <ul>
            {results.map((result) => (
              <li className={result.ok ? "is-ok" : "is-error"} key={result.id}>
                <strong>{result.title}</strong>
                <span>{result.message}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
