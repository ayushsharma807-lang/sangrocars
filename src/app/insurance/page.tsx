"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ServiceLeadForm from "@/app/components/ServiceLeadForm";

type InsuranceForm = {
  vehicleType: "Car" | "Bike" | "Commercial vehicle";
  vehicleValue: string;
  policyType: "Third-party" | "Comprehensive" | "Renewal";
  city: string;
};

const defaultForm: InsuranceForm = {
  vehicleType: "Car",
  vehicleValue: "",
  policyType: "Comprehensive",
  city: "",
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const parseAmount = (value: string) => {
  const raw = value.trim().toLowerCase().replace(/,/g, "");
  if (!raw) return 0;
  if (raw.includes("lakh") || raw.endsWith("l")) {
    const numeric = Number.parseFloat(raw.replace("lakh", "").replace("lac", "").replace("l", "").trim());
    return Number.isFinite(numeric) ? numeric * 100000 : 0;
  }
  const numeric = Number.parseFloat(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const getWhatsappHref = () => {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ??
    "919041322997";
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    "Hi SangroCars, I want an insurance quote."
  )}`;
};

export default function InsurancePage() {
  const [form, setForm] = useState<InsuranceForm>(defaultForm);

  const result = useMemo(() => {
    const value = parseAmount(form.vehicleValue);
    const multiplier =
      form.policyType === "Third-party" ? [0.009, 0.016] : form.policyType === "Renewal" ? [0.018, 0.032] : [0.022, 0.045];
    const low = value * multiplier[0];
    const high = value * multiplier[1];
    return { value, low, high };
  }, [form]);

  const whatsappHref = getWhatsappHref();
  const defaultMessage = [
    `Vehicle type: ${form.vehicleType}`,
    form.vehicleValue ? `Vehicle value: ${form.vehicleValue}` : null,
    `Policy type: ${form.policyType}`,
    form.city ? `City: ${form.city}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <main className="service-page">
      <section className="service-page__shell finance-page__shell">
        <header className="service-page__header">
          <Link href="/" className="service-page__brand" aria-label="SangroCars home">
            <img src="/images/sangrocars-logo.png" alt="SangroCars" />
            <div>
              <div className="service-page__brand-name">SangroCars</div>
              <div className="service-page__brand-line">
                Cars • Properties • Finance • Mutual Funds • Insurance
              </div>
            </div>
          </Link>
          <Link href="/" className="service-page__back">
            Back to services
          </Link>
        </header>

        <section className="service-page__hero finance-page__hero">
          <p className="service-page__eyebrow">Insurance</p>
          <h1>Insurance</h1>
          <p>
            Get a fast premium estimate for your vehicle, then send SangroCars a quote request for
            renewals, new policies, or claim support.
          </p>
        </section>

        <section className="finance-page__grid">
          <article className="service-page__card finance-page__card">
            <div className="finance-page__section-header">
              <div>
                <h2>Quick Estimate Form</h2>
                <p>Use this simple estimate to understand your likely premium range.</p>
              </div>
            </div>

            <div className="finance-page__form-grid">
              <label className="finance-page__field">
                <span>Vehicle Type</span>
                <select
                  value={form.vehicleType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      vehicleType: event.target.value as InsuranceForm["vehicleType"],
                    }))
                  }
                >
                  <option>Car</option>
                  <option>Bike</option>
                  <option>Commercial vehicle</option>
                </select>
              </label>

              <label className="finance-page__field">
                <span>Vehicle Value</span>
                <input
                  value={form.vehicleValue}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, vehicleValue: event.target.value }))
                  }
                  placeholder="e.g. 7.5 lakh"
                />
              </label>

              <label className="finance-page__field">
                <span>Policy Type</span>
                <select
                  value={form.policyType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      policyType: event.target.value as InsuranceForm["policyType"],
                    }))
                  }
                >
                  <option>Third-party</option>
                  <option>Comprehensive</option>
                  <option>Renewal</option>
                </select>
              </label>

              <label className="finance-page__field">
                <span>City</span>
                <input
                  value={form.city}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, city: event.target.value }))
                  }
                  placeholder="e.g. Jalandhar"
                />
              </label>
            </div>
          </article>

          <article className="service-page__card finance-page__card">
            <div className="finance-page__section-header">
              <div>
                <h2>Premium Range</h2>
                <p>Indicative estimate based on vehicle type, value and policy preference.</p>
              </div>
            </div>

            <div className="finance-page__result-grid finance-page__result-grid--compact">
              <div className="finance-page__metric">
                <span>Vehicle Value</span>
                <strong>{formatMoney(result.value)}</strong>
              </div>
              <div className="finance-page__metric">
                <span>Policy Type</span>
                <strong>{form.policyType}</strong>
              </div>
              <div className="finance-page__metric finance-page__metric--full">
                <span>Estimated Premium Range</span>
                <strong>
                  {formatMoney(result.low)} — {formatMoney(result.high)}
                </strong>
              </div>
            </div>

            <div className="finance-page__support-points">
              <div>
                <span>Support includes</span>
                <strong>New policies, renewals, IDV guidance, and claim assistance</strong>
              </div>
              <div>
                <span>Best next step</span>
                <strong>Send details for a final quote from SangroCars support</strong>
              </div>
            </div>

            <div className="finance-page__actions">
              <a href="#insurance-quote-form" className="service-page__button service-page__button--dark">
                Get Final Quote
              </a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="service-page__button">
                Chat on WhatsApp
              </a>
            </div>
          </article>
        </section>

        <ServiceLeadForm
          id="insurance-quote-form"
          serviceType="insurance"
          title="Get Final Quote"
          description="Share your vehicle and policy requirement. SangroCars will help with pricing, renewals and claim support."
          submitLabel="Get Final Quote"
          messagePlaceholder="Tell us the vehicle, policy type, renewal date or claim help you need."
          defaultMessage={defaultMessage}
        />
      </section>
    </main>
  );
}
