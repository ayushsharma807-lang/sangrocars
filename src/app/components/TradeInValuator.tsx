"use client";

import { useMemo, useState } from "react";

type Props = {
  make?: string | null;
  model?: string | null;
  currentPrice?: number | null;
};

type ApiResponse = {
  low: number;
  high: number;
  expected: number;
  confidence: "low" | "medium" | "high";
  notes: string[];
  provider?: "blackbook" | "marketcheck" | "internal";
};

const formatInr = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function TradeInValuator({ make, model, currentPrice }: Props) {
  const [vin, setVin] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [year, setYear] = useState("");
  const [km, setKm] = useState("");
  const [condition, setCondition] = useState("good");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApiResponse | null>(null);

  const defaultYear = useMemo(() => String(new Date().getFullYear() - 4), []);

  const getValuation = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/trade-in/valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin: vin.trim() || undefined,
          postalCode: postalCode.trim() || undefined,
          make,
          model,
          year: Number(year || defaultYear),
          km: Number(km || 0),
          condition,
          currentPrice,
        }),
      });
      if (!response.ok) {
        throw new Error("valuation_error");
      }
      const payload = (await response.json()) as ApiResponse;
      setResult(payload);
    } catch {
      setError("Could not fetch valuation right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="experience-builder">
      <div className="experience-builder__grid">
        <label>
          VIN (optional, needed for provider quote)
          <input
            value={vin}
            onChange={(event) => setVin(event.target.value.toUpperCase())}
            placeholder="17-character VIN"
          />
        </label>
        <label>
          ZIP / PIN code
          <input
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
            placeholder="e.g., 144001"
          />
        </label>
        <label>
          Year
          <input
            type="number"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            placeholder={defaultYear}
          />
        </label>
        <label>
          KM driven
          <input
            type="number"
            value={km}
            onChange={(event) => setKm(event.target.value)}
            placeholder="45000"
          />
        </label>
        <label>
          Condition
          <select
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
          >
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </label>
      </div>
      <div className="experience-builder__actions">
        <button className="simple-button" onClick={getValuation} type="button" disabled={loading}>
          {loading ? "Calculating..." : "Get instant trade-in value"}
        </button>
      </div>
      {error && <p className="experience-error">{error}</p>}
      {result && (
        <div className="experience-builder__summary">
          <p>
            Estimated offer range: <strong>{formatInr(result.low)}</strong> -{" "}
            <strong>{formatInr(result.high)}</strong>
          </p>
          <p>Expected value: {formatInr(result.expected)} (confidence: {result.confidence})</p>
          <p>Source: {(result.provider ?? "internal").toUpperCase()}</p>
          {result.notes.length > 0 && (
            <ul className="experience-list">
              {result.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
