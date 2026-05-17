"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import MobileServiceShell from "@/app/components/MobileServiceShell";

type VehicleType = "Car" | "Bike" | "Commercial Vehicle";
type FuelType = "Petrol" | "Diesel" | "CNG" | "Electric";
type PolicyType = "Third Party" | "Comprehensive" | "Own Damage";
type PolicyStatus = "Active" | "Expired" | "New vehicle";
type ClaimStatus = "Yes" | "No";

type InsuranceForm = {
  fullName: string;
  phone: string;
  city: string;
  vehicleType: VehicleType;
  registrationNumber: string;
  make: string;
  model: string;
  year: string;
  fuelType: FuelType;
  previousPolicyStatus: PolicyStatus;
  claimLastYear: ClaimStatus;
  policyType: PolicyType;
  idvEstimate: string;
};

const productCards = [
  {
    title: "Car Insurance",
    type: "Car" as VehicleType,
    icon: "🚗",
    priority: true,
    copy: "Comprehensive and third-party quotes for private cars.",
  },
  {
    title: "Bike Insurance",
    type: "Bike" as VehicleType,
    icon: "🏍️",
    priority: true,
    copy: "Fast renewal and new policy support for two-wheelers.",
  },
  {
    title: "Commercial Vehicle Insurance",
    type: "Commercial Vehicle" as VehicleType,
    icon: "🚚",
    priority: true,
    copy: "Policy support for pickups, trucks and commercial fleets.",
  },
  {
    title: "Health Insurance",
    icon: "🩺",
    priority: false,
    copy: "Family and individual medical cover guidance.",
  },
  {
    title: "Term Life Insurance",
    icon: "🛡️",
    priority: false,
    copy: "Protection planning for long-term family security.",
  },
  {
    title: "Family Health Insurance",
    icon: "👨‍👩‍👧",
    priority: false,
    copy: "One policy planning for the whole family.",
  },
  {
    title: "Travel Insurance",
    icon: "✈️",
    priority: false,
    copy: "Travel medical and baggage cover assistance.",
  },
  {
    title: "Home Insurance",
    icon: "🏠",
    priority: false,
    copy: "Home and contents protection support.",
  },
];

const faq = [
  [
    "Is this the final insurance price?",
    "No. This is an estimated premium range. Final price depends on insurer rules, IDV, NCB, inspection and coverage.",
  ],
  [
    "Can Sangro Insurance help with expired policy renewal?",
    "Yes. Share your vehicle details and our advisor will guide you through renewal and inspection requirements.",
  ],
  [
    "What documents are needed?",
    "RC, previous policy, Aadhaar/PAN and claim history are usually needed.",
  ],
  [
    "Can I compare multiple insurers?",
    "Yes. Sangro Insurance can help compare available insurer options manually for now.",
  ],
];

const inputClass =
  "min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-50";

const parseMoney = (value: string) => {
  const raw = value.trim().toLowerCase().replace(/,/g, "");
  if (!raw) return 0;
  if (raw.includes("lakh") || raw.includes("lac") || raw.endsWith("l")) {
    const amount = Number.parseFloat(
      raw.replace("lakh", "").replace("lac", "").replace(/l$/, "")
    );
    return Number.isFinite(amount) ? amount * 100000 : 0;
  }
  const amount = Number.parseFloat(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      {children}
    </label>
  );
}

function ProductCard({
  product,
  onSelect,
}: {
  product: (typeof productCards)[number];
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group min-h-44 rounded-[24px] border bg-white p-4 text-left shadow-[0_12px_32px_rgba(15,23,42,0.05)] transition active:scale-[0.99] sm:p-5 md:hover:-translate-y-1 md:hover:shadow-[0_24px_70px_rgba(15,23,42,0.10)] ${
        product.priority
          ? "border-sky-200 ring-4 ring-sky-50"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-2xl">
          {product.icon}
        </span>
        {product.priority ? (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
            Priority
          </span>
        ) : null}
      </div>
      <h3 className="mt-5 text-xl font-black text-slate-950">
        {product.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{product.copy}</p>
      <span className="mt-5 inline-flex text-sm font-black text-sky-700 group-hover:underline">
        Get quote →
      </span>
    </button>
  );
}

function PremiumRangeCard({ min, max }: { min: number; max: number }) {
  return (
    <div className="rounded-[28px] border border-sky-200 bg-gradient-to-br from-sky-50 to-emerald-50 p-6">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">
        Estimated premium range
      </p>
      <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">
        {formatMoney(min)} - {formatMoney(max)}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        Final premium depends on insurer, IDV, NCB, claims, vehicle age, and
        inspection.
      </p>
    </div>
  );
}

export default function InsurancePage() {
  const [form, setForm] = useState<InsuranceForm>({
    fullName: "",
    phone: "",
    city: "Jalandhar",
    vehicleType: "Car",
    registrationNumber: "",
    make: "",
    model: "",
    year: "2021",
    fuelType: "Petrol",
    previousPolicyStatus: "Active",
    claimLastYear: "No",
    policyType: "Comprehensive",
    idvEstimate: "8 lakh",
  });
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const result = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const age = Math.max(
      currentYear - (Number.parseInt(form.year, 10) || currentYear),
      0
    );
    const idv = parseMoney(form.idvEstimate);

    let min = 3000;
    let max = 9000;
    if (form.vehicleType === "Bike") [min, max] = [1200, 4000];
    if (form.vehicleType === "Car" && form.policyType === "Third Party")
      [min, max] = [3000, 9000];
    if (form.vehicleType === "Car" && form.policyType === "Comprehensive")
      [min, max] = [8000, 35000];
    if (form.vehicleType === "Car" && form.policyType === "Own Damage")
      [min, max] = [5500, 22000];
    if (form.vehicleType === "Commercial Vehicle") [min, max] = [15000, 80000];

    const ageFactor = age > 8 ? 1.18 : age > 4 ? 1.1 : 1;
    const fuelFactor =
      form.fuelType === "Electric" ? 1.15 : form.fuelType === "CNG" ? 1.08 : 1;
    const claimFactor = form.claimLastYear === "Yes" ? 1.22 : 1;
    const expiredFactor = form.previousPolicyStatus === "Expired" ? 1.12 : 1;
    const idvFactor = idv > 2000000 ? 1.25 : idv > 1000000 ? 1.12 : 1;

    min = Math.round(
      min * ageFactor * fuelFactor * claimFactor * expiredFactor * idvFactor
    );
    max = Math.round(
      max * ageFactor * fuelFactor * claimFactor * expiredFactor * idvFactor
    );
    return { min, max, age, idv };
  }, [form]);

  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919041322997";
  const whatsappText = encodeURIComponent(
    `Hi Sangro Insurance, I need a quote.\nName: ${form.fullName}\nPhone: ${
      form.phone
    }\nVehicle: ${form.vehicleType} ${form.make} ${form.model}\nPolicy: ${
      form.policyType
    }\nEstimated premium: ${formatMoney(result.min)} - ${formatMoney(
      result.max
    )}`
  );

  const submitQuote = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitted(false);
    if (!form.fullName.trim() || !form.phone.trim()) {
      setError("Please enter your name and phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/service-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: "insurance",
          name: form.fullName.trim(),
          full_name: form.fullName.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          vehicle_type: form.vehicleType,
          registration_number: form.registrationNumber.trim(),
          make: form.make.trim(),
          model: form.model.trim(),
          year: form.year,
          fuel_type: form.fuelType,
          previous_policy_status: form.previousPolicyStatus,
          claim_last_year: form.claimLastYear,
          policy_type: form.policyType,
          estimated_premium_min: result.min,
          estimated_premium_max: result.max,
          message: `Insurance quote request. Registration: ${
            form.registrationNumber || "not shared"
          }. IDV estimate: ${
            form.idvEstimate || "not shared"
          }. Estimated premium range: ${formatMoney(
            result.min
          )} - ${formatMoney(result.max)}.`,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!response.ok)
        throw new Error(data?.error || "Could not save insurance lead.");
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not submit insurance quote request."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectProduct = (vehicleType?: VehicleType) => {
    if (vehicleType) setForm((current) => ({ ...current, vehicleType }));
    setQuoteOpen(true);
    window.setTimeout(
      () =>
        document
          .getElementById("quote-form")
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50
    );
  };

  return (
    <main className="min-h-screen bg-white pb-36 pt-16 text-slate-950 md:pb-0 md:pt-0">
      <MobileServiceShell
        service="insurance"
        ctaLabel="Get Quote"
        ctaHref="#quote-form"
      />
      <nav className="sticky top-0 z-40 hidden border-b border-slate-100 bg-white/90 backdrop-blur-xl md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-black tracking-tight">
            Sangro Insurance
          </Link>
          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#products" className="hover:text-slate-950">
              Products
            </a>
            <a href="#quote-form" className="hover:text-slate-950">
              Quote
            </a>
            <a href="#faq" className="hover:text-slate-950">
              FAQ
            </a>
          </div>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold hover:border-slate-950"
          >
            Talk to Expert
          </a>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 md:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
        <div>
          <div className="mb-5 inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-sky-700">
            Insurance marketplace support
          </div>
          <h1 className="max-w-3xl text-4xl font-black tracking-[-0.05em] sm:text-6xl lg:text-7xl">
            Let’s find you the best insurance.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-xl">
            Compare estimated insurance options and let Sangro Insurance help
            you get the right policy.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => selectProduct("Car")}
              className="rounded-2xl bg-slate-950 px-6 py-4 text-base font-black text-white shadow-xl shadow-slate-950/10 transition hover:-translate-y-0.5"
            >
              Get Insurance Quote
            </button>
            <a
              href={`https://wa.me/${whatsappNumber}`}
              className="rounded-2xl border border-slate-300 px-6 py-4 text-center text-base font-black hover:border-slate-950"
            >
              Talk to Expert
            </a>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-5 lg:shadow-[0_30px_100px_rgba(15,23,42,0.10)]">
          <PremiumRangeCard min={result.min} max={result.max} />
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ["Policy status", form.previousPolicyStatus],
              ["Claim last year", form.claimLastYear],
              ["Vehicle age", `${result.age} years`],
              ["Policy type", form.policyType],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  {label}
                </p>
                <p className="mt-2 text-lg font-black">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="products"
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10 lg:px-8"
      >
        <div className="mb-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
            Insurance products
          </p>
          <h2 className="mt-3 text-4xl font-black tracking-tight">
            Choose the cover you need.
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {productCards.map((product) => (
            <ProductCard
              key={product.title}
              product={product}
              onSelect={() =>
                selectProduct("type" in product ? product.type : undefined)
              }
            />
          ))}
        </div>
      </section>

      <section
        id="quote-form"
        className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8"
      >
        <form
          onSubmit={submitQuote}
          className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6"
        >
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-700">
                Vehicle quote estimator
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Enter details for premium range.
              </h2>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
              Estimate only
            </span>
          </div>

          {!quoteOpen ? (
            <button
              type="button"
              onClick={() => selectProduct("Car")}
              className="mb-6 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
            >
              Open quote form
            </button>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input
                className={inputClass}
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </Field>
            <Field label="Phone number">
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </Field>
            <Field label="City">
              <input
                className={inputClass}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="Vehicle type">
              <select
                className={inputClass}
                value={form.vehicleType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    vehicleType: e.target.value as VehicleType,
                  })
                }
              >
                <option>Car</option>
                <option>Bike</option>
                <option>Commercial Vehicle</option>
              </select>
            </Field>
            <Field label="Registration number">
              <input
                className={inputClass}
                value={form.registrationNumber}
                onChange={(e) =>
                  setForm({ ...form, registrationNumber: e.target.value })
                }
                placeholder="PB08..."
              />
            </Field>
            <Field label="Make">
              <input
                className={inputClass}
                value={form.make}
                onChange={(e) => setForm({ ...form, make: e.target.value })}
                placeholder="Toyota"
              />
            </Field>
            <Field label="Model">
              <input
                className={inputClass}
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Innova"
              />
            </Field>
            <Field label="Year">
              <input
                className={inputClass}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                inputMode="numeric"
              />
            </Field>
            <Field label="Fuel type">
              <select
                className={inputClass}
                value={form.fuelType}
                onChange={(e) =>
                  setForm({ ...form, fuelType: e.target.value as FuelType })
                }
              >
                <option>Petrol</option>
                <option>Diesel</option>
                <option>CNG</option>
                <option>Electric</option>
              </select>
            </Field>
            <Field label="Previous policy status">
              <select
                className={inputClass}
                value={form.previousPolicyStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    previousPolicyStatus: e.target.value as PolicyStatus,
                  })
                }
              >
                <option>Active</option>
                <option>Expired</option>
                <option>New vehicle</option>
              </select>
            </Field>
            <Field label="Claim last year">
              <select
                className={inputClass}
                value={form.claimLastYear}
                onChange={(e) =>
                  setForm({
                    ...form,
                    claimLastYear: e.target.value as ClaimStatus,
                  })
                }
              >
                <option>No</option>
                <option>Yes</option>
              </select>
            </Field>
            <Field label="Policy type">
              <select
                className={inputClass}
                value={form.policyType}
                onChange={(e) =>
                  setForm({ ...form, policyType: e.target.value as PolicyType })
                }
              >
                <option>Third Party</option>
                <option>Comprehensive</option>
                <option>Own Damage</option>
              </select>
            </Field>
            <Field label="IDV estimate optional">
              <input
                className={inputClass}
                value={form.idvEstimate}
                onChange={(e) =>
                  setForm({ ...form, idvEstimate: e.target.value })
                }
                placeholder="8 lakh"
              />
            </Field>
          </div>

          {error ? (
            <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </p>
          ) : null}
          {submitted ? (
            <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              Estimated premium range: {formatMoney(result.min)} -{" "}
              {formatMoney(result.max)}. Sangro Insurance will contact you with
              final options.
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              disabled={isSubmitting}
              className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white disabled:opacity-60"
              type="submit"
            >
              {isSubmitting ? "Saving..." : "Request Best Quote"}
            </button>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`}
              className="rounded-2xl border border-slate-300 px-6 py-4 text-center font-black hover:border-slate-950"
            >
              WhatsApp Details
            </a>
          </div>
        </form>

        <div className="space-y-5">
          <PremiumRangeCard min={result.min} max={result.max} />
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
            <h3 className="text-2xl font-black">Compare plans</h3>
            <div className="mt-5 grid gap-3">
              {[
                ["Basic", "Third-party focused, lowest premium"],
                ["Standard", "Balanced comprehensive protection"],
                ["Premium", "Higher IDV + add-on ready plan"],
              ].map(([name, copy]) => (
                <div
                  key={name}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <p className="font-black">{name}</p>
                  <p className="mt-1 text-sm text-slate-600">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
            <h2 className="text-3xl font-black">Why choose Sangro Insurance</h2>
            <div className="mt-6 grid gap-3">
              {[
                "Human advisor support",
                "Vehicle-first guidance",
                "Renewal and claim help",
                "Multiple insurer comparison",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 p-4 font-bold"
                >
                  ✓ {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
            <h2 className="text-3xl font-black">How it works</h2>
            <ol className="mt-6 grid gap-3">
              {[
                "Enter vehicle details",
                "Get estimated range",
                "Sangro Insurance advisor calls",
                "Compare insurer options",
                "Final policy issued",
              ].map((item, index) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-2xl border border-slate-200 p-4"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <span className="font-bold">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section
        id="faq"
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8"
      >
        <h2 className="text-4xl font-black tracking-tight">Insurance FAQ</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {faq.map(([question, answer]) => (
            <div
              key={question}
              className="rounded-3xl border border-slate-200 p-5"
            >
              <p className="font-black">{question}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 md:pb-14 lg:px-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <strong>Disclaimer:</strong> Sangro Insurance provides estimated
          insurance premium ranges only. Final premium, policy approval, IDV,
          NCB, inspection, and coverage are subject to insurer rules and
          verification.
        </div>
      </section>
    </main>
  );
}
