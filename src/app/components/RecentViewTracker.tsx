"use client";

import { useEffect } from "react";

type Props = {
  listingId: string;
  price: number | null;
  make: string | null;
  model: string | null;
};

const STORAGE_KEY = "carhub:recently-viewed";

export default function RecentViewTracker({ listingId, price, make, model }: Props) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const current = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
      const filtered = current.filter((item) => item.id !== listingId);
      const next = [
        {
          id: listingId,
          price,
          make,
          model,
          viewedAt: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, 40);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore client storage issues.
    }
  }, [listingId, make, model, price]);

  return null;
}
