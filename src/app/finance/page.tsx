"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ServiceLeadForm from "@/app/components/ServiceLeadForm";

type EligibilityForm = {
  monthlyIncome: string;
  existingEmis: string;
  employmentType: "Salaried" | "Self-employed";
  loanType: "Car" | "Personal" | "Business";
  loanAmountNeeded: string;
};

type EmiForm = {
  loanAmount: string;
  interestRate: string;
  tenureMonths: string;
};

const defaultEligibility: EligibilityForm = {
  monthlyIncome: "",
  existingEmis: "",
  employmentType: "Salaried",
  loanType: "Car",
  loanAmountNeeded: "",
};

const defaultEmiForm: EmiForm = {
  loanAmount: "",
  interestRate: "12",
  tenureMonths: "60",
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
  if (raw.includes("crore") || raw.endsWith("cr")) {
    const numeric = Number.parseFloat(raw.replace("crore", "").replace("cr", "").trim());
    return Number.isFinite(numeric) ? numeric * 10000000 : 0;
  }
  const numeric = Number.parseFloat(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const calculateEmi = (principal: number, annualRate: number, tenureMonths: number) => {
  if (principal <= 0 || annualRate <= 0 || tenureMonths <= 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
};

const approvalMeta = (emiShare: number) => {
  if (emiShare < 0.3) {
    return { label: "High", tone: "good" as const };
  }
  if (emiShare <= 0.45) {
    return { label: "Medium", tone: "medium" as const };
  }
  return { label: "Low", tone: "risk" as const };
};

const getWhatsappHref = () => {
  const raw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ??
    process.env.NEXT_PUBLIC_SUPPORT_PHONE ??
    "919041322997";
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    "Hi SangroCars, I want help with finance eligibility."
  )}`;
};

export default function FinancePage() {
  const [eligibilityForm, setEligibilityForm] = useState<EligibilityForm>(defaultEligibility);
  const [emiForm, setEmiForm] = useState<EmiForm>(defaultEmiForm);

  const eligibilityResult = useMemo(() => {
    const income = parseAmount(eligibilityForm.monthlyIncome);
    const existingEmis = parseAmount(eligibilityForm.existingEmis);
    const loanAmountNeeded = parseAmount(eligibilityForm.loanAmountNeeded);

    const eligibleEmi = Math.max(income * 0.4 - existingEmis, 0);
    const estimatedLoan = eligibleEmi * 50;
    const estimatedEmi = calculateEmi(loanAmountNeeded, 12, 60);
    const emiShare = income > 0 ? estimatedEmi / income : 0;
    const approval = approvalMeta(emiShare);

    return {
      income,
      existingEmis,
      loanAmountNeeded,
      eligibleEmi,
      estimatedLoan,
      rangeLow: estimatedLoan * 0.8,
      rangeHigh: estimatedLoan * 1.2,
      estimatedEmi,
      approval,
    };
  }, [eligibilityForm]);

  const emiCalculatorResult = useMemo(() => {
    const principal = parseAmount(emiForm.loanAmount);
    const annualRate = Number.parseFloat(emiForm.interestRate || "0");
    const tenureMonths = Number.parseInt(emiForm.tenureMonths || "0", 10);
    const monthlyEmi = calculateEmi(principal, annualRate, tenureMonths);
    const totalPayable = monthlyEmi * tenureMonths;
    const totalInterest = totalPayable - principal;

    return { principal, annualRate, tenureMonths, monthlyEmi, totalInterest, totalPayable };
  }, [emiForm]);

  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "9041322997";
  const whatsappHref = getWhatsappHref();
  const financeLeadSummary = [
    eligibilityForm.monthlyIncome
      ? `Monthly income: ${eligibilityForm.monthlyIncome}`
      : null,
    eligibilityForm.existingEmis
      ? `Existing EMIs: ${eligibilityForm.existingEmis}`
      : null,
    `Employment type: ${eligibilityForm.employmentType}`,
    `Loan type: ${eligibilityForm.loanType}`,
    eligibilityForm.loanAmountNeeded
      ? `Loan needed: ${eligibilityForm.loanAmountNeeded}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <main className="service-page finance-page">
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
          <p className="service-page__eyebrow">Finance eligibility</p>
          <h1>Finance Services</h1>
          <p>
            Estimate your loan eligibility, check EMI, and send a finance support request to
            SangroCars. This page is built for lead generation and service support only.
          </p>
        </section>

        <section className="finance-page__grid">
          <article className="service-page__card finance-page__card">
            <div className="finance-page__section-header">
              <div>
                <h2>Loan Eligibility Form</h2>
                <p>
                  Uses FOIR-based logic to estimate the EMI you can safely handle.
                </p>
              </div>
            </div>

            <div className="finance-page__form-grid">
              <label className="finance-page__field">
                <span>Monthly Income</span>
                <input
                  value={eligibilityForm.monthlyIncome}
                  onChange={(event) =>
                    setEligibilityForm((current) => ({
                      ...current,
                      monthlyIncome: event.target.value,
                    }))
                  }
                  placeholder="e.g. 75000"
                />
              </label>

              <label className="finance-page__field">
                <span>Existing EMIs (optional)</span>
                <input
                  value={eligibilityForm.existingEmis}
                  onChange={(event) =>
                    setEligibilityForm((current) => ({
                      ...current,
                      existingEmis: event.target.value,
                    }))
                  }
                  placeholder="e.g. 15000"
                />
              </label>

              <label className="finance-page__field">
                <span>Employment Type</span>
                <select
                  value={eligibilityForm.employmentType}
                  onChange={(event) =>
                    setEligibilityForm((current) => ({
                      ...current,
                      employmentType: event.target.value as EligibilityForm["employmentType"],
                    }))
                  }
                >
                  <option>Salaried</option>
                  <option>Self-employed</option>
                </select>
              </label>

              <label className="finance-page__field">
                <span>Loan Type</span>
                <select
                  value={eligibilityForm.loanType}
                  onChange={(event) =>
                    setEligibilityForm((current) => ({
                      ...current,
                      loanType: event.target.value as EligibilityForm["loanType"],
                    }))
                  }
                >
                  <option>Car</option>
                  <option>Personal</option>
                  <option>Business</option>
                </select>
              </label>

              <label className="finance-page__field finance-page__field--full">
                <span>Loan Amount Needed</span>
                <input
                  value={eligibilityForm.loanAmountNeeded}
                  onChange={(event) =>
                    setEligibilityForm((current) => ({
                      ...current,
                      loanAmountNeeded: event.target.value,
                    }))
                  }
                  placeholder="e.g. 8 lakh"
                />
              </label>
            </div>
          </article>

          <article className="service-page__card finance-page__card">
            <div className="finance-page__section-header">
              <div>
                <h2>Eligibility Result</h2>
                <p>Quick estimate based on 40% FOIR and a 5-year approximation.</p>
              </div>
              <span className={`finance-page__status finance-page__status--${eligibilityResult.approval.tone}`}>
                {eligibilityResult.approval.label} approval chance
              </span>
            </div>

            <div className="finance-page__result-grid">
              <div className="finance-page__metric">
                <span>Eligible EMI</span>
                <strong>{formatMoney(eligibilityResult.eligibleEmi)}</strong>
              </div>
              <div className="finance-page__metric">
                <span>Estimated EMI</span>
                <strong>{formatMoney(eligibilityResult.estimatedEmi)}</strong>
              </div>
              <div className="finance-page__metric finance-page__metric--full">
                <span>Estimated Loan Range</span>
                <strong>
                  {formatMoney(eligibilityResult.rangeLow)} — {formatMoney(eligibilityResult.rangeHigh)}
                </strong>
              </div>
              <div className="finance-page__metric">
                <span>Interest Rate</span>
                <strong>8% – 16%</strong>
              </div>
              <div className="finance-page__metric">
                <span>Entered Loan Need</span>
                <strong>{formatMoney(eligibilityResult.loanAmountNeeded)}</strong>
              </div>
            </div>

            <div className="finance-page__actions">
              <a
                href="#finance-apply-form"
                className="service-page__button service-page__button--dark"
              >
                Apply Now
              </a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="service-page__button">
                Chat on WhatsApp
              </a>
            </div>
          </article>
        </section>

        <section className="finance-page__grid finance-page__grid--single">
          <article className="service-page__card finance-page__card">
            <div className="finance-page__section-header">
              <div>
                <h2>EMI Calculator</h2>
                <p>Use the standard EMI formula to estimate monthly outflow.</p>
              </div>
            </div>

            <div className="finance-page__form-grid">
              <label className="finance-page__field">
                <span>Loan Amount</span>
                <input
                  value={emiForm.loanAmount}
                  onChange={(event) =>
                    setEmiForm((current) => ({ ...current, loanAmount: event.target.value }))
                  }
                  placeholder="e.g. 600000"
                />
              </label>
              <label className="finance-page__field">
                <span>Interest Rate (%)</span>
                <input
                  value={emiForm.interestRate}
                  onChange={(event) =>
                    setEmiForm((current) => ({ ...current, interestRate: event.target.value }))
                  }
                  placeholder="e.g. 12"
                />
              </label>
              <label className="finance-page__field">
                <span>Tenure (months)</span>
                <input
                  value={emiForm.tenureMonths}
                  onChange={(event) =>
                    setEmiForm((current) => ({ ...current, tenureMonths: event.target.value }))
                  }
                  placeholder="e.g. 60"
                />
              </label>
            </div>

            <div className="finance-page__result-grid finance-page__result-grid--compact">
              <div className="finance-page__metric">
                <span>Monthly EMI</span>
                <strong>{formatMoney(emiCalculatorResult.monthlyEmi)}</strong>
              </div>
              <div className="finance-page__metric">
                <span>Total Interest</span>
                <strong>{formatMoney(emiCalculatorResult.totalInterest)}</strong>
              </div>
              <div className="finance-page__metric">
                <span>Total Payable</span>
                <strong>{formatMoney(emiCalculatorResult.totalPayable)}</strong>
              </div>
            </div>
          </article>

          <article className="service-page__card finance-page__card finance-page__support-card">
            <h2>Support & Disclaimer</h2>
            <p>
              Eligibility and EMI are estimates. Final approval depends on bank verification,
              credit score and documentation.
            </p>
            <div className="finance-page__support-points">
              <div>
                <span>Phone support</span>
                <strong>{supportPhone}</strong>
              </div>
              <div>
                <span>Best for</span>
                <strong>Vehicle, personal and business finance support</strong>
              </div>
            </div>
            <div className="finance-page__actions">
              <a
                href="#finance-apply-form"
                className="service-page__button service-page__button--dark"
              >
                Apply Now
              </a>
              <a href={whatsappHref} target="_blank" rel="noreferrer" className="service-page__button">
                Chat on WhatsApp
              </a>
            </div>
          </article>
        </section>

        <ServiceLeadForm
          id="finance-apply-form"
          serviceType="finance"
          title="Apply Now"
          description="Send your finance requirement to SangroCars. We will review your estimate and contact you for the next step."
          submitLabel="Apply Now"
          messagePlaceholder="Tell us what kind of loan support you need."
          defaultMessage={financeLeadSummary}
        />
      </section>
    </main>
  );
}
