"use client";

import { useMemo, useState } from "react";

type Props = {
  minBound: number;
  maxBound: number;
  initialMin?: number | null;
  initialMax?: number | null;
  initialMode?: string | null;
};

const formatMoney = (value: number) => `Rs ${value.toLocaleString("en-IN")}`;

export default function PriceRangeSlider({
  minBound,
  maxBound,
  initialMin,
  initialMax,
  initialMode,
}: Props) {
  const safeMinBound = Math.max(0, Math.floor(minBound));
  const safeMaxBound = Math.max(safeMinBound + 10000, Math.floor(maxBound));
  const step = Math.max(10000, Math.round((safeMaxBound - safeMinBound) / 100));

  const startMin = useMemo(() => {
    if (initialMin && Number.isFinite(initialMin)) {
      return Math.min(Math.max(initialMin, safeMinBound), safeMaxBound);
    }
    return safeMinBound;
  }, [initialMin, safeMinBound, safeMaxBound]);

  const startMax = useMemo(() => {
    if (initialMax && Number.isFinite(initialMax)) {
      return Math.min(Math.max(initialMax, safeMinBound), safeMaxBound);
    }
    return safeMaxBound;
  }, [initialMax, safeMinBound, safeMaxBound]);

  const [minValue, setMinValue] = useState(startMin);
  const [maxValue, setMaxValue] = useState(Math.max(startMax, startMin));
  const [mode, setMode] = useState(initialMode === "custom" ? "custom" : "any");

  const handleMin = (nextRaw: number) => {
    const next = Math.min(nextRaw, maxValue);
    setMinValue(next);
    setMode("custom");
  };

  const handleMax = (nextRaw: number) => {
    const next = Math.max(nextRaw, minValue);
    setMaxValue(next);
    setMode("custom");
  };

  return (
    <div className="price-slider">
      <div className="price-slider__values">
        <div className="price-slider__value">
          <span>Min</span>
          <strong>{formatMoney(minValue)}</strong>
        </div>
        <div className="price-slider__value price-slider__value--right">
          <span>Max</span>
          <strong>{formatMoney(maxValue)}</strong>
        </div>
      </div>
      <input
        type="range"
        min={safeMinBound}
        max={safeMaxBound}
        step={step}
        value={minValue}
        onChange={(event) => handleMin(Number(event.target.value))}
      />
      <input
        type="range"
        min={safeMinBound}
        max={safeMaxBound}
        step={step}
        value={maxValue}
        onChange={(event) => handleMax(Number(event.target.value))}
      />
      <div className="price-slider__actions">
        <button
          type="button"
          className="simple-link-btn"
          onClick={() => {
            setMode("any");
            setMinValue(safeMinBound);
            setMaxValue(safeMaxBound);
          }}
        >
          Any price
        </button>
      </div>
      <input type="hidden" name="price_mode" value={mode} />
      <input type="hidden" name="min_price" value={mode === "custom" ? String(minValue) : ""} />
      <input type="hidden" name="max_price" value={mode === "custom" ? String(maxValue) : ""} />
    </div>
  );
}
