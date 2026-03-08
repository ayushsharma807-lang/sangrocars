"use client";

import { useState } from "react";

type Props = {
  listingId: string;
  title: string;
  price: number | null;
  location: string | null;
  photo: string | null;
  iconOnly?: boolean;
};

const STORAGE_KEY = "carhub:garage:listings";

export default function SaveToGarageButton({
  listingId,
  title,
  price,
  location,
  photo,
  iconOnly = false,
}: Props) {
  const [saved, setSaved] = useState(false);

  const save = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const current = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
      const filtered = current.filter((item) => item.listingId !== listingId);
      const next = [
        {
          id: crypto.randomUUID(),
          listingId,
          title,
          price,
          location,
          photo,
          savedAt: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 50);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      setSaved(false);
    }
  };

  return (
    <button
      className={iconOnly ? "garage-save-icon" : "simple-button simple-button--secondary"}
      onClick={save}
      type="button"
      aria-label={saved ? "Saved to My Garage" : "Save to My Garage"}
      title={saved ? "Saved to My Garage" : "Save to My Garage"}
    >
      {iconOnly ? (saved ? "❤" : "♡") : saved ? "Saved to My Garage" : "Save to My Garage"}
    </button>
  );
}
