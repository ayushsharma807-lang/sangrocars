"use client";

import { useMemo, useState } from "react";
import ServiceLeadForm from "@/app/components/ServiceLeadForm";
import ServicePlatformShell from "@/app/components/ServicePlatformShell";

type VehicleType = "Car" | "Bike" | "Commercial Vehicle";
type FuelType = "Petrol" | "Diesel" | "CNG" | "Electric";
type PolicyType = "Third Party" | "Comprehensive" | "Own Damage";
type WorkflowStep = "vehicle" | "policy" | "idv" | "premium" | "support";

type InsuranceForm = {
  vehicleType: VehicleType;
  makeModel: string;
  registrationYear: string;
  fuelType: FuelType;
  city: string;
  vehicleValue: string;
  policyType: PolicyType;
  addons: string[];
};

type PlanCard = {
  name: string;
  insurer: string;
  claimRate: string;
  turnaround: string;
  recommendedFor: string;
  multiplier: number;
};

const steps: { key: WorkflowStep; label: string; detail: string }[] = [
  { key: "vehicle", label: "Vehicle Details", detail: "Make, year and city setup" },
  { key: "policy", label: "Policy Type", detail: "Third party, OD or comprehensive" },
  { key: "idv", label: "IDV Estimate", detail: "Depreciation and vehicle value" },
  { key: "premium", label: "Premium Range", detail: "Base premium plus add-ons" },
  { key: "support", label: "Claim / Renewal Support", detail: "Human help when you need it" },
];

const addOnOptions = [
  { id: "zero-dep", label: "Zero Dep", impact: 0.0045, note: "Best for premium cars and newer vehicles" },
  { id: "engine-protect", label: "Engine Protect", impact: 0.0028, note: "Useful during monsoon and flood zones" },
  { id: "return-to-invoice", label: "Return to Invoice", impact: 0.0032, note: "Recommended for cars under 3 years old" },
  { id: "roadside-assistance", label: "Roadside Assistance", impact: 0.0014, note: "Good for highway or city commute use" },
];

const planCards: PlanCard[] = [
  {
    name: "Basic",
    insurer: "Claim Lite",
    claimRate: "92.1%",
    turnaround: "2-3 business days",
    recommendedFor: "Mandatory cover and budget-first users",
    multiplier: 0.93,
  },
  {
    name: "Standard",
    insurer: "Trusted Shield",
    claimRate: "95.8%",
    turnaround: "48-hour support",
    recommendedFor: "Best balance for city commuters",
    multiplier: 1,
  },
  {
    name: "Premium",
    insurer: "Elite Drive Protect",
    claimRate: "97.4%",
    turnaround: "Priority relationship manager",
    recommendedFor: "High-value cars and zero-dep buyers",
    multiplier: 1.12,
  },
];

const defaultForm: InsuranceForm = {
  vehicleType: "Car",
  makeModel: "Hyundai Creta",
  registrationYear: "2022",
  fuelType: "Petrol",
  city: "Jalandhar",
  vehicleValue: "12.8 lakh",
  policyType: "Comprehensive",
  addons: ["Zero Dep", "Roadside Assistance"],
};

const documents = [
  "RC copy",
  "Previous policy",
  "Aadhaar / PAN",
  "Claim history (if any)",
];

const parseAmount = (value: string) => {
  const raw = value.trim().toLowerCase().replace(/,/g, "");
  if (!raw) return 0;
  if (raw.includes("lakh") || raw.endsWith("l")) {
    const numeric = Number.parseFloat(
      raw.replace("lakh", "").replace("lac", "").replace(/l$/, "").trim(),
    );
    return Number.isFinite(numeric) ? numeric * 100000 : 0;
  }
  if (raw.includes("crore") || raw.endsWith("cr")) {
    const numeric = Number.parseFloat(raw.replace("crore", "").replace(/cr$/, "").trim());
    return Number.isFinite(numeric) ? numeric * 10000000 : 0;
  }
  const numeric = Number.parseFloat(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

function QuoteModal({
  title,
  description,
  defaultMessage,
  onClose,
}: {
  title: string;
  description: string;
  defaultMessage: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              SangroCars insurance desk
            </p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500"
          >
            Close
          </button>
        </div>
        <ServiceLeadForm
          serviceType="insurance"
          title={title}
          description={description}
          submitLabel="Send request"
          defaultMessage={defaultMessage}
          messagePlaceholder="Tell SangroCars if this is a new policy, renewal, or claim help."
        />
      </div>
    </div>
  );
}

export default function InsurancePage() {
  const [form, setForm] = useState<InsuranceForm>(defaultForm);
  const [activeStep, setActiveStep] = useState<WorkflowStep>("vehicle");
  const [selectedPlan, setSelectedPlan] = useState<string>("Standard");
  const [activeModal, setActiveModal] = useState<null | {
    title: string;
    description: string;
    defaultMessage: string;
  }>(null);

  const result = useMemo(() => {
    const vehicleValue = parseAmount(form.vehicleValue);
    const currentYear = new Date().getFullYear();
    const age = form.registrationYear
      ? Math.max(currentYear - Number.parseInt(form.registrationYear, 10), 0)
      : 0;

    const depreciationRate = Math.min(age * 0.08, 0.55);
    const estimatedIdv = vehicleValue ? vehicleValue * (1 - depreciationRate) : 0;

    const baseRate =
      form.policyType === "Third Party"
        ? 0.017
        : form.policyType === "Own Damage"
          ? 0.024
          : 0.031;

    const addOnImpact = form.addons.reduce((total, addon) => {
      const found = addOnOptions.find((item) => item.label === addon);
      return total + (found ? estimatedIdv * found.impact : 0);
    }, 0);

    const lowPremium = estimatedIdv * baseRate + addOnImpact;
    const highPremium = lowPremium * 1.22;
    const selectedPlanMeta = planCards.find((plan) => plan.name === selectedPlan) ?? planCards[1];
    const selectedPremium = lowPremium * selectedPlanMeta.multiplier;

    return {
      age,
      estimatedIdv,
      lowPremium,
      highPremium,
      addOnImpact,
      selectedPremium,
      premiumShare:
        estimatedIdv > 0 ? Math.min((selectedPremium / estimatedIdv) * 100, 100) : 0,
    };
  }, [form, selectedPlan]);

  const leadMessage = [
    `Vehicle type: ${form.vehicleType}`,
    form.makeModel ? `Make / model: ${form.makeModel}` : null,
    form.registrationYear ? `Registration year: ${form.registrationYear}` : null,
    `Fuel: ${form.fuelType}`,
    form.city ? `City: ${form.city}` : null,
    form.vehicleValue ? `Vehicle value: ${form.vehicleValue}` : null,
    `Policy type: ${form.policyType}`,
    form.addons.length ? `Add-ons: ${form.addons.join(", ")}` : null,
    `Preferred plan: ${selectedPlan}`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      <ServicePlatformShell
        section="insurance"
        title="Vehicle Insurance Estimate"
        subtitle="Compare plan tiers, estimate IDV, understand premium ranges and move through a real quote-and-renewal workflow with SangroCars."
        statusLabel="Quote engine live"
        statusTone="accent"
        quickStats={[
          { label: "Estimated IDV", value: formatMoney(result.estimatedIdv) },
          { label: "Premium range", value: `${formatMoney(result.lowPremium)} - ${formatMoney(result.highPremium)}` },
          { label: "Selected plan", value: selectedPlan, tone: "success" },
          { label: "Claim support", value: "24h callback", tone: "accent" },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() =>
                setActiveModal({
                  title: "Get Final Quote",
                  description:
                    "Share your vehicle and policy details with SangroCars for final insurer matching and a premium quote.",
                  defaultMessage: `Get Final Quote\n${leadMessage}`,
                })
              }
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Get Final Quote
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveModal({
                  title: "Claim Assistance",
                  description:
                    "Get help with claim filing, survey coordination and insurer follow-up from SangroCars.",
                  defaultMessage: `Claim Assistance\n${leadMessage}`,
                })
              }
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
            >
              Claim Assistance
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Insurance workflow
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Quote, compare, renew
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {steps.map((step) => (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setActiveStep(step.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      activeStep === step.key
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-5">
              {steps.map((step, index) => (
                <article
                  key={step.key}
                  className={`rounded-[24px] border p-4 ${
                    activeStep === step.key
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                        activeStep === step.key
                          ? "bg-white/10 text-white"
                          : "bg-white text-slate-950"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{step.label}</p>
                      <p
                        className={`mt-1 text-xs leading-5 ${
                          activeStep === step.key ? "text-slate-200" : "text-slate-500"
                        }`}
                      >
                        {step.detail}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Step 1 &amp; 2
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Vehicle and policy setup
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep("premium")}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900"
                >
                  Estimate Premium
                </button>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Vehicle type</span>
                  <select
                    value={form.vehicleType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        vehicleType: event.target.value as VehicleType,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
                  >
                    <option>Car</option>
                    <option>Bike</option>
                    <option>Commercial Vehicle</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Make / model</span>
                  <input
                    value={form.makeModel}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, makeModel: event.target.value }))
                    }
                    placeholder="e.g. Hyundai Creta"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Registration year</span>
                  <input
                    value={form.registrationYear}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        registrationYear: event.target.value,
                      }))
                    }
                    placeholder="e.g. 2022"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Fuel type</span>
                  <select
                    value={form.fuelType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fuelType: event.target.value as FuelType,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
                  >
                    <option>Petrol</option>
                    <option>Diesel</option>
                    <option>CNG</option>
                    <option>Electric</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>City</span>
                  <input
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, city: event.target.value }))
                    }
                    placeholder="e.g. Jalandhar"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Current IDV / vehicle value</span>
                  <input
                    value={form.vehicleValue}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, vehicleValue: event.target.value }))
                    }
                    placeholder="e.g. 12.8 lakh"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Policy type</span>
                  <select
                    value={form.policyType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        policyType: event.target.value as PolicyType,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950"
                  >
                    <option>Third Party</option>
                    <option>Comprehensive</option>
                    <option>Own Damage</option>
                  </select>
                </label>
              </div>

              <div className="mt-6 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Add-on builder
                    </p>
                    <h4 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">
                      Choose cover enhancements
                    </h4>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                    {form.addons.length} selected
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {addOnOptions.map((addon) => {
                    const active = form.addons.includes(addon.label);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            addons: active
                              ? current.addons.filter((item) => item !== addon.label)
                              : [...current.addons, addon.label],
                          }))
                        }
                        className={`rounded-[24px] border p-4 text-left transition ${
                          active
                            ? "border-slate-950 bg-white shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <strong className="text-sm font-semibold text-slate-950">
                            {addon.label}
                          </strong>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {active ? "Added" : "Optional"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{addon.note}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>

            <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Step 3 &amp; 4
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Quote snapshot
                  </h3>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Live estimate
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estimated IDV</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">
                    {formatMoney(result.estimatedIdv)}
                  </p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Vehicle age</p>
                  <p className="mt-2 text-xl font-semibold text-slate-950">{result.age} years</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Premium range</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {formatMoney(result.lowPremium)} - {formatMoney(result.highPremium)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Add-ons currently contribute {formatMoney(result.addOnImpact)} to the estimated
                    premium.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[26px] border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">Premium share of IDV</p>
                  <span className="text-xs text-slate-500">
                    {result.premiumShare.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-950 transition-all"
                    style={{ width: `${Math.max(12, Math.min(result.premiumShare, 100))}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Renewal countdown
                </p>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-slate-950">18 days</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Recommended to renew before inspection or IDV reset.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveModal({
                        title: "Renew Policy",
                        description:
                          "SangroCars will compare renewal options and help keep your coverage active.",
                        defaultMessage: `Renew Policy\n${leadMessage}`,
                      })
                    }
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                  >
                    Renew Policy
                  </button>
                </div>
              </div>
            </aside>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Compare plans
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Basic, Standard, Premium
                  </h3>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  Step 4
                </span>
              </div>
              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                {planCards.map((plan) => {
                  const selected = selectedPlan === plan.name;
                  return (
                    <button
                      key={plan.name}
                      type="button"
                      onClick={() => setSelectedPlan(plan.name)}
                      className={`rounded-[26px] border p-4 text-left transition ${
                        selected
                          ? "border-slate-950 bg-slate-950 text-white shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <strong className="text-lg font-semibold tracking-tight">{plan.name}</strong>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            selected
                              ? "bg-white/10 text-white"
                              : "bg-white text-slate-600"
                          }`}
                        >
                          {plan.claimRate}
                        </span>
                      </div>
                      <p className={`mt-2 text-sm ${selected ? "text-slate-200" : "text-slate-600"}`}>
                        {plan.insurer}
                      </p>
                      <div className="mt-4 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Estimated premium</span>
                          <strong>{formatMoney(result.lowPremium * plan.multiplier)}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Claim support</span>
                          <strong>{plan.turnaround}</strong>
                        </div>
                      </div>
                      <p
                        className={`mt-4 text-sm leading-6 ${
                          selected ? "text-slate-100" : "text-slate-600"
                        }`}
                      >
                        {plan.recommendedFor}
                      </p>
                    </button>
                  );
                })}
              </div>
            </article>

            <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                    Step 5
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    Documents and service support
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep("support")}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900"
                >
                  Review support
                </button>
              </div>
              <div className="mt-5 space-y-3">
                {documents.map((document) => (
                  <div
                    key={document}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  >
                    <span>{document}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                      Required
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Policy status
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Plan compare", value: "Ready" },
                    { label: "Renewal support", value: "Open" },
                    { label: "Claim help", value: "Available" },
                    { label: "Document check", value: "Pending your upload" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </section>
        </div>
      </ServicePlatformShell>

      {activeModal ? (
        <QuoteModal
          title={activeModal.title}
          description={activeModal.description}
          defaultMessage={activeModal.defaultMessage}
          onClose={() => setActiveModal(null)}
        />
      ) : null}
    </>
  );
}
