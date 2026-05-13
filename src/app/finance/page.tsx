"use client";

import { useMemo, useState } from "react";
import ServiceLeadForm from "@/app/components/ServiceLeadForm";
import ServicePlatformShell from "@/app/components/ServicePlatformShell";

type EmploymentType = "Salaried" | "Business";
type LoanType = "Used Car" | "New Car" | "Personal" | "Business";
type CibilRange = "780+" | "720-779" | "680-719" | "Below 680";
type StepKey = "vehicle" | "income" | "result" | "documents" | "submit";
type TrackerStage = "Submitted" | "Under Review" | "Bank Verification" | "Approved" | "Disbursed";

type EligibilityForm = {
  vehiclePrice: string;
  downPayment: string;
  loanAmount: string;
  monthlyIncome: string;
  existingEmis: string;
  employmentType: EmploymentType;
  loanType: LoanType;
  cibilRange: CibilRange;
  tenureMonths: string;
  interestRate: string;
};

const stepItems: { key: StepKey; label: string; detail: string }[] = [
  { key: "vehicle", label: "Vehicle Details", detail: "Price, down payment and loan requirement" },
  { key: "income", label: "Income Details", detail: "Income, existing EMI and profile" },
  { key: "result", label: "Eligibility Result", detail: "FOIR, EMI and approval outlook" },
  { key: "documents", label: "Documents Required", detail: "KYC and lender checklist" },
  { key: "submit", label: "Submit Application", detail: "Send lead to SangroCars team" },
];

const trackerStages: TrackerStage[] = [
  "Submitted",
  "Under Review",
  "Bank Verification",
  "Approved",
  "Disbursed",
];

const bankOffers = [
  { bank: "HDFC Bank", rate: "9.25%", tenure: "Up to 84 months", processing: "₹3,500 onwards", turnAround: "Same day review" },
  { bank: "ICICI Bank", rate: "9.40%", tenure: "Up to 72 months", processing: "0.5% of loan", turnAround: "24-hour callback" },
  { bank: "Axis Bank", rate: "9.65%", tenure: "Up to 84 months", processing: "₹4,999", turnAround: "Used-car friendly" },
];

const documents = [
  "Aadhaar card",
  "PAN card",
  "Bank statement (6 months)",
  "Salary slip or latest ITR",
  "RC and current insurance for used cars",
];

const defaultEligibility: EligibilityForm = {
  vehiclePrice: "9.5 lakh",
  downPayment: "1.5 lakh",
  loanAmount: "8 lakh",
  monthlyIncome: "85000",
  existingEmis: "12000",
  employmentType: "Salaried",
  loanType: "Used Car",
  cibilRange: "720-779",
  tenureMonths: "60",
  interestRate: "10.5",
};

const parseAmount = (value: string) => {
  const raw = value.trim().toLowerCase().replace(/,/g, "");
  if (!raw) return 0;
  if (raw.includes("lakh") || raw.endsWith("l")) {
    const numeric = Number.parseFloat(raw.replace("lakh", "").replace("lac", "").replace(/l$/, "").trim());
    return Number.isFinite(numeric) ? numeric * 100000 : 0;
  }
  if (raw.includes("crore") || raw.endsWith("cr")) {
    const numeric = Number.parseFloat(raw.replace("crore", "").replace(/cr$/, "").trim());
    return Number.isFinite(numeric) ? numeric * 10000000 : 0;
  }
  const numeric = Number.parseFloat(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatMoney = (value: number, digits = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

const calculateEmi = (principal: number, annualRate: number, tenureMonths: number) => {
  if (principal <= 0 || annualRate <= 0 || tenureMonths <= 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  return (principal * monthlyRate * factor) / (factor - 1);
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 rounded-full bg-slate-100">
      <div
        className="h-2 rounded-full bg-slate-950 transition-all"
        style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
      />
    </div>
  );
}

function ApplicationModal({ defaultMessage, onClose }: { defaultMessage: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">SangroCars finance desk</p>
            <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Submit finance application</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-500">
            Close
          </button>
        </div>
        <ServiceLeadForm
          serviceType="finance"
          title="Apply with SangroCars"
          description="Send your application details for lender matching, document review and callback support."
          submitLabel="Apply Now"
          messagePlaceholder="Mention preferred bank, timeline, and any co-applicant details."
          defaultMessage={defaultMessage}
        />
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [form, setForm] = useState<EligibilityForm>(defaultEligibility);
  const [activeStep, setActiveStep] = useState<StepKey>("vehicle");
  const [showApplication, setShowApplication] = useState(false);
  const [trackerIndex, setTrackerIndex] = useState(1);

  const result = useMemo(() => {
    const vehiclePrice = parseAmount(form.vehiclePrice);
    const downPayment = parseAmount(form.downPayment);
    const enteredLoan = parseAmount(form.loanAmount);
    const loanAmount = enteredLoan || Math.max(vehiclePrice - downPayment, 0);
    const monthlyIncome = parseAmount(form.monthlyIncome);
    const existingEmis = parseAmount(form.existingEmis);
    const eligibleEmi = Math.max(monthlyIncome * 0.4 - existingEmis, 0);
    const maxLoanEstimate = eligibleEmi * 50;
    const annualRate = Number.parseFloat(form.interestRate || "0");
    const tenureMonths = Number.parseInt(form.tenureMonths || "0", 10);
    const emi = calculateEmi(loanAmount, annualRate, tenureMonths);
    const totalPayable = emi * tenureMonths;
    const totalInterest = totalPayable - loanAmount;
    const requiredDownPayment = Math.max(vehiclePrice - maxLoanEstimate, 0);
    const emiShare = monthlyIncome > 0 ? emi / monthlyIncome : 0;

    let label = "Eligible";
    let tone: "success" | "warn" | "danger" = "success";
    if (emiShare > 0.45 || form.cibilRange === "Below 680") {
      label = "Low eligibility";
      tone = "danger";
    } else if (emiShare > 0.3 || form.cibilRange === "680-719") {
      label = "Maybe eligible";
      tone = "warn";
    }

    return {
      vehiclePrice,
      downPayment,
      loanAmount,
      monthlyIncome,
      eligibleEmi,
      maxLoanEstimate,
      emi,
      totalPayable,
      totalInterest,
      requiredDownPayment,
      emiShare,
      label,
      tone,
      rangeLow: maxLoanEstimate * 0.8,
      rangeHigh: maxLoanEstimate * 1.2,
    };
  }, [form]);

  const amortization = useMemo(() => {
    const annualRate = Number.parseFloat(form.interestRate || "0");
    const tenureMonths = Number.parseInt(form.tenureMonths || "0", 10);
    const monthlyRate = annualRate / 12 / 100;
    const emi = result.emi;
    let principalOutstanding = result.loanAmount;
    return Array.from({ length: Math.min(12, tenureMonths) }).map((_, index) => {
      const interest = principalOutstanding * monthlyRate;
      const principal = Math.max(emi - interest, 0);
      principalOutstanding = Math.max(principalOutstanding - principal, 0);
      return {
        month: index + 1,
        emi,
        interest,
        principal,
        balance: principalOutstanding,
      };
    });
  }, [form.interestRate, form.tenureMonths, result.emi, result.loanAmount]);

  const leadMessage = [
    `Loan type: ${form.loanType}`,
    form.vehiclePrice ? `Vehicle price: ${form.vehiclePrice}` : null,
    form.downPayment ? `Down payment: ${form.downPayment}` : null,
    form.loanAmount ? `Loan amount needed: ${form.loanAmount}` : null,
    form.monthlyIncome ? `Monthly income: ${form.monthlyIncome}` : null,
    form.existingEmis ? `Existing EMI: ${form.existingEmis}` : null,
    `Employment type: ${form.employmentType}`,
    `CIBIL range: ${form.cibilRange}`,
    `Estimated eligibility: ${result.label}`,
  ]
    .filter(Boolean)
    .join("\n");

  const chartBars = [
    { label: "FOIR", value: Math.min(result.eligibleEmi / Math.max(result.monthlyIncome || 1, 1), 1) * 100 },
    { label: "EMI Fit", value: Math.min(result.emiShare * 100, 100) },
    { label: "Down Payment", value: result.vehiclePrice ? (result.downPayment / result.vehiclePrice) * 100 : 0 },
  ];

  const toneClass =
    result.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : result.tone === "warn"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <>
      <ServicePlatformShell
        section="finance"
        title="Car Loan & Finance Eligibility"
        subtitle="A real workflow-style console for vehicle funding, FOIR checks, EMI planning, document readiness and application tracking through SangroCars."
        statusLabel={trackerStages[trackerIndex]}
        statusTone={trackerIndex >= 3 ? "success" : trackerIndex === 2 ? "accent" : "default"}
        quickStats={[
          { label: "Eligible EMI", value: formatMoney(result.eligibleEmi), tone: result.tone === "danger" ? "danger" : "success" },
          { label: "Max loan estimate", value: formatMoney(result.maxLoanEstimate) },
          { label: "Suggested EMI", value: formatMoney(result.emi) },
          { label: "Loan amount", value: formatMoney(result.loanAmount), tone: "accent" },
        ]}
        actions={
          <>
            <button
              type="button"
              onClick={() => {
                setActiveStep("submit");
                setShowApplication(true);
              }}
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
            >
              Apply with SangroCars
            </button>
            <a
              href="https://wa.me/919041322997?text=Hi%20SangroCars%2C%20I%20want%20help%20with%20loan%20documents."
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900"
            >
              WhatsApp Documents
            </a>
          </>
        }
      >
        <div className="space-y-6">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Application workflow</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">From vehicle details to approval tracking</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {stepItems.map((step) => (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setActiveStep(step.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${activeStep === step.key ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700"}`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-5">
              {stepItems.map((step, index) => (
                <article
                  key={step.key}
                  className={`rounded-[24px] border p-4 ${activeStep === step.key ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${activeStep === step.key ? "bg-white/10 text-white" : "bg-white text-slate-950"}`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{step.label}</p>
                      <p className={`mt-1 text-xs leading-5 ${activeStep === step.key ? "text-slate-200" : "text-slate-500"}`}>{step.detail}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Step 1 &amp; 2</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Eligibility checker</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep("result")}
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900"
                >
                  Check Eligibility
                </button>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Loan type</span>
                  <select value={form.loanType} onChange={(e) => setForm((current) => ({ ...current, loanType: e.target.value as LoanType }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950">
                    <option>Used Car</option>
                    <option>New Car</option>
                    <option>Personal</option>
                    <option>Business</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Vehicle price</span>
                  <input value={form.vehiclePrice} onChange={(e) => setForm((current) => ({ ...current, vehiclePrice: e.target.value }))} placeholder="e.g. 9.5 lakh" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Down payment</span>
                  <input value={form.downPayment} onChange={(e) => setForm((current) => ({ ...current, downPayment: e.target.value }))} placeholder="e.g. 1.5 lakh" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Loan amount</span>
                  <input value={form.loanAmount} onChange={(e) => setForm((current) => ({ ...current, loanAmount: e.target.value }))} placeholder="Auto-calculate if blank" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Monthly income</span>
                  <input value={form.monthlyIncome} onChange={(e) => setForm((current) => ({ ...current, monthlyIncome: e.target.value }))} placeholder="e.g. 85000" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Existing EMI</span>
                  <input value={form.existingEmis} onChange={(e) => setForm((current) => ({ ...current, existingEmis: e.target.value }))} placeholder="Optional" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Employment type</span>
                  <select value={form.employmentType} onChange={(e) => setForm((current) => ({ ...current, employmentType: e.target.value as EmploymentType }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950">
                    <option>Salaried</option>
                    <option>Business</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>CIBIL score range</span>
                  <select value={form.cibilRange} onChange={(e) => setForm((current) => ({ ...current, cibilRange: e.target.value as CibilRange }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950">
                    <option>780+</option>
                    <option>720-779</option>
                    <option>680-719</option>
                    <option>Below 680</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  <span>Tenure</span>
                  <select value={form.tenureMonths} onChange={(e) => setForm((current) => ({ ...current, tenureMonths: e.target.value }))} className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-slate-950">
                    <option value="36">36 months</option>
                    <option value="48">48 months</option>
                    <option value="60">60 months</option>
                    <option value="72">72 months</option>
                    <option value="84">84 months</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                  <span>Interest rate (%)</span>
                  <input value={form.interestRate} onChange={(e) => setForm((current) => ({ ...current, interestRate: e.target.value }))} placeholder="e.g. 10.5" className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none focus:border-slate-950" />
                </label>
              </div>
            </article>

            <aside className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Step 3</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Eligibility result</h3>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>{result.label}</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Eligible EMI</p><p className="mt-2 text-xl font-semibold text-slate-950">{formatMoney(result.eligibleEmi)}</p></div>
                <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estimated EMI</p><p className="mt-2 text-xl font-semibold text-slate-950">{formatMoney(result.emi)}</p></div>
                <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Loan range</p><p className="mt-2 text-base font-semibold text-slate-950">{formatMoney(result.rangeLow)} - {formatMoney(result.rangeHigh)}</p></div>
                <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Required down payment</p><p className="mt-2 text-xl font-semibold text-slate-950">{formatMoney(result.requiredDownPayment)}</p></div>
              </div>
              <div className="mt-5 rounded-[26px] border border-slate-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-950">Eligibility strength</p>
                  <span className="text-xs text-slate-500">Interest range 8%–16%</span>
                </div>
                <div className="space-y-3">
                  {chartBars.map((bar) => (
                    <div key={bar.label}>
                      <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                        <span>{bar.label}</span>
                        <span>{bar.value.toFixed(0)}%</span>
                      </div>
                      <ProgressBar value={bar.value} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"><span>Loan amount</span><strong className="text-slate-950">{formatMoney(result.loanAmount)}</strong></div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"><span>Total interest</span><strong className="text-slate-950">{formatMoney(result.totalInterest)}</strong></div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"><span>Total payable</span><strong className="text-slate-950">{formatMoney(result.totalPayable)}</strong></div>
              </div>
            </aside>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Lender comparison</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Bank offers</h3>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">Updated by team</span>
              </div>
              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                {bankOffers.map((offer) => (
                  <article key={offer.bank} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="text-lg font-semibold tracking-tight text-slate-950">{offer.bank}</h4>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{offer.rate}</span>
                    </div>
                    <div className="mt-4 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center justify-between"><span>Tenure</span><strong className="text-slate-950">{offer.tenure}</strong></div>
                      <div className="flex items-center justify-between"><span>Processing</span><strong className="text-slate-950">{offer.processing}</strong></div>
                      <div className="flex items-center justify-between"><span>Turnaround</span><strong className="text-slate-950">{offer.turnAround}</strong></div>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">EMI planner</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Repayment preview</h3>
                </div>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">{form.tenureMonths} months</span>
              </div>
              <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.22em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Month</th>
                      <th className="px-4 py-3">EMI</th>
                      <th className="px-4 py-3">Principal</th>
                      <th className="px-4 py-3">Interest</th>
                      <th className="px-4 py-3">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {amortization.map((row) => (
                      <tr key={row.month}>
                        <td className="px-4 py-4 font-medium text-slate-950">{row.month}</td>
                        <td className="px-4 py-4">{formatMoney(row.emi)}</td>
                        <td className="px-4 py-4">{formatMoney(row.principal)}</td>
                        <td className="px-4 py-4">{formatMoney(row.interest)}</td>
                        <td className="px-4 py-4">{formatMoney(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Step 4</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Documents required</h3>
                </div>
                <button type="button" onClick={() => setActiveStep("documents")} className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900">Review</button>
              </div>
              <div className="mt-5 space-y-3">
                {documents.map((document) => (
                  <div key={document} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <span>{document}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500">Required</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Step 5</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Application tracker</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTrackerIndex((current) => Math.min(current + 1, trackerStages.length - 1))}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                >
                  Advance stage
                </button>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-5">
                {trackerStages.map((stage, index) => {
                  const active = index <= trackerIndex;
                  return (
                    <div key={stage} className={`rounded-[24px] border p-4 ${active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                      <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${active ? "bg-white/10 text-white" : "bg-white text-slate-900"}`}>{index + 1}</span>
                      <p className="text-sm font-semibold">{stage}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => setShowApplication(true)} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white">Apply with SangroCars</button>
                <a href="https://wa.me/919041322997?text=Hi%20SangroCars%2C%20I%20want%20to%20share%20my%20loan%20documents." target="_blank" rel="noreferrer" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900">WhatsApp Documents</a>
              </div>
            </article>
          </section>

          <p className="text-xs leading-6 text-slate-500">
            Eligibility and EMI are estimates. Final approval depends on bank verification, credit score and documentation. SangroCars does not disburse loans inside the app.
          </p>
        </div>
      </ServicePlatformShell>

      {showApplication ? <ApplicationModal defaultMessage={leadMessage} onClose={() => setShowApplication(false)} /> : null}
    </>
  );
}
