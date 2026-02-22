"use client";

import { useMemo, useState } from "react";
import useHydrated from "@/app/components/useHydrated";

type DealDraft = {
  fullName: string;
  phone: string;
  city: string;
  financePlan: string;
  downPayment: string;
  tradeIn: string;
  protectionPlan: string;
  showroomDate: string;
};

const STORAGE_KEY = "carhub:deal-builder";

const defaultState: DealDraft = {
  fullName: "",
  phone: "",
  city: "",
  financePlan: "cash",
  downPayment: "",
  tradeIn: "no",
  protectionPlan: "standard",
  showroomDate: "",
};

const loadInitialDraft = (): DealDraft => {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<DealDraft>;
    return { ...defaultState, ...parsed };
  } catch {
    return defaultState;
  }
};

function UnifiedDealBuilderInner() {
  const [draft, setDraft] = useState<DealDraft>(() => loadInitialDraft());
  const [saved, setSaved] = useState(false);
  const [completed, setCompleted] = useState(false);

  const referenceCode = useMemo(
    () =>
      `CH-${(draft.fullName || "GUEST").slice(0, 3).toUpperCase()}-${new Date()
        .toISOString()
        .slice(2, 10)
        .replace(/-/g, "")}`,
    [draft.fullName]
  );

  const update = (key: keyof DealDraft, value: string) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const saveDraft = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const completeDeal = () => {
    saveDraft();
    setCompleted(true);
  };

  return (
    <div className="experience-card">
      <h3>Unified dealmaking (save and continue)</h3>
      <p>Start your deal online, then finish in the showroom without repeating details.</p>
      <div className="experience-builder__grid">
        <label>
          Full name
          <input
            value={draft.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            placeholder="Customer name"
          />
        </label>
        <label>
          Phone
          <input
            value={draft.phone}
            onChange={(event) => update("phone", event.target.value)}
            placeholder="9876543210"
          />
        </label>
        <label>
          City
          <input
            value={draft.city}
            onChange={(event) => update("city", event.target.value)}
            placeholder="Jalandhar"
          />
        </label>
        <label>
          Finance
          <select
            value={draft.financePlan}
            onChange={(event) => update("financePlan", event.target.value)}
          >
            <option value="cash">Cash purchase</option>
            <option value="bank-loan">Bank loan</option>
            <option value="dealer-finance">Dealer finance</option>
          </select>
        </label>
        <label>
          Down payment (INR)
          <input
            value={draft.downPayment}
            onChange={(event) => update("downPayment", event.target.value)}
            placeholder="200000"
          />
        </label>
        <label>
          Trade-in
          <select value={draft.tradeIn} onChange={(event) => update("tradeIn", event.target.value)}>
            <option value="no">No trade-in</option>
            <option value="yes">Yes, evaluate my car</option>
          </select>
        </label>
        <label>
          Protection plan
          <select
            value={draft.protectionPlan}
            onChange={(event) => update("protectionPlan", event.target.value)}
          >
            <option value="standard">Standard warranty</option>
            <option value="extended">Extended 3-year plan</option>
            <option value="premium">Premium + roadside support</option>
          </select>
        </label>
        <label>
          Showroom visit date
          <input
            type="date"
            value={draft.showroomDate}
            onChange={(event) => update("showroomDate", event.target.value)}
          />
        </label>
      </div>
      <div className="experience-inline-actions">
        <button className="simple-button simple-button--secondary" type="button" onClick={saveDraft}>
          {saved ? "Draft saved" : "Save and continue later"}
        </button>
        <button className="simple-button" type="button" onClick={completeDeal}>
          Submit pre-deal
        </button>
      </div>
      {completed && (
        <div className="experience-builder__summary">
          <p>
            Deal reference: <strong>{referenceCode}</strong>
          </p>
          <p>Share this code in showroom to continue from exactly this step.</p>
        </div>
      )}
    </div>
  );
}

export default function UnifiedDealBuilder() {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div className="experience-card">
        <h3>Unified dealmaking (save and continue)</h3>
        <p>Loading deal builder...</p>
      </div>
    );
  }

  return <UnifiedDealBuilderInner />;
}
