"use client";

import { useMemo } from "react";
import useHydrated from "@/app/components/useHydrated";

type Props = {
  listingId: string;
  currentPrice: number | null;
  marketMedian: number | null;
};

type ViewedItem = {
  id?: string;
  price?: number | null;
};

const STORAGE_KEY = "carhub:recently-viewed";

const percentageDelta = (value: number, base: number) => {
  if (!Number.isFinite(value) || !Number.isFinite(base) || base === 0) return 0;
  return ((value - base) / base) * 100;
};

export default function PersonalizedPriceSignal({
  listingId,
  currentPrice,
  marketMedian,
}: Props) {
  const hydrated = useHydrated();
  const averageViewedPrice = useMemo(() => {
    if (!hydrated || typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const viewed = JSON.parse(raw) as ViewedItem[];
      const prices = viewed
        .filter((item) => item.id !== listingId)
        .map((item) => Number(item.price ?? 0))
        .filter((value) => Number.isFinite(value) && value > 0)
        .slice(0, 12);
      if (prices.length === 0) return null;
      const average = prices.reduce((sum, value) => sum + value, 0) / prices.length;
      return Math.round(average);
    } catch {
      return null;
    }
  }, [listingId, hydrated]);

  const message = useMemo(() => {
    if (!currentPrice) return null;
    if (averageViewedPrice) {
      const delta = percentageDelta(currentPrice, averageViewedPrice);
      if (delta <= -5) {
        return `This price is ${Math.abs(delta).toFixed(
          1
        )}% below your recent browsing average.`;
      }
      if (delta >= 5) {
        return `This price is ${delta.toFixed(1)}% above your recent browsing average.`;
      }
      return "This price is close to the cars you viewed recently.";
    }
    if (marketMedian) {
      const delta = percentageDelta(currentPrice, marketMedian);
      if (delta <= -5) return "This car is priced below the current market median.";
      if (delta >= 5) return "This car is priced above the current market median.";
      return "This car is around the current market median.";
    }
    return null;
  }, [averageViewedPrice, currentPrice, marketMedian]);

  if (!message) return null;
  return <p className="experience-note">{message}</p>;
}
