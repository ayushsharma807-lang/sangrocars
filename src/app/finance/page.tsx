"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type EmploymentType = "Salaried" | "Business";
type LoanType = "Used Car" | "New Car" | "Personal" | "Business";
type CibilRange = "780+" | "720-779" | "680-719" | "Below 680";
type ApprovalChance = "High" | "Medium" | "Low";

type PreApprovalForm = {
  fullName: string;
  phone: string;
  city: string;
  monthlyIncome: string;
  existingEmi: string;
  employmentType: EmploymentType;
  cibilRange: CibilRange;
  loanType: LoanType;
  desiredLoanAmount: string;
};

type EmiForm = {
  loanAmount: string;
  downPayment: string;
  interestRate: string;
  tenureMonths: string;
  processingFee: string;
};

const cibilInterestRange: Record<CibilRange, string> = {
  "780+": "8% - 10.5%",
  "720-779": "9.5% - 12%",
  "680-719": "12% - 15%",
  "Below 680": "15% - 18%",
};

const cibilMidRate: Record<CibilRange, number> = {
  "780+": 9.25,
  "720-779": 10.75,
  "680-719": 13.5,
  "Below 680": 16.5,
};

const processSteps = [
  "Submit details",
  "Sangro Finance verifies documents",
  "We match bank/NBFC options",
  "Bank processes final approval",
  "Loan disbursed",
];

const documents = [
  "Aadhaar card",
  "PAN card",
  "6-month bank statement",
  "Salary slip or ITR",
  "RC / insurance for used car finance",
];

const parseMoney = (value: string) => {
  const raw = value.trim().toLowerCase().replace(/,/g, "");
  if (!raw) return 0;
  if (raw.includes("lakh") || raw.includes("lac") || raw.endsWith("l")) {
    const amount = Number.parseFloat(raw.replace("lakh", "").replace("lac", "").replace(/l$/, ""));
    return Number.isFinite(amount) ? amount * 100000 : 0;
  }
  if (raw.includes("crore") || raw.endsWith("cr")) {
    const amount = Number.parseFloat(raw.replace("crore", "").replace(/cr$/, ""));
    return Number.isFinite(amount) ? amount * 10000000 : 0;
  }
  const amount = Number.parseFloat(raw.replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
};

const formatMoney = (value: number, digits = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

const formatPercent = (value: number) => `${Math.round(value * 10) / 10}%`;

const calculateEmi = (principal: number, annualRate: number, months: number) => {
  if (principal <= 0 || annualRate <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
};

const getApprovalChance = (
  income: number,
  desiredEmi: number,
  cibilRange: CibilRange,
): ApprovalChance => {
  const emiBurden = income > 0 ? desiredEmi / income : 1;
  if (cibilRange === "Below 680" || emiBurden > 0.45) return "Low";
  if (emiBurden <= 0.3 && (cibilRange === "780+" || cibilRange === "720-779")) return "High";
  return "Medium";
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-100";

function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">{value}</p>
      {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

function ApprovalBadge({ chance }: { chance: ApprovalChance }) {
  const classes =
    chance === "High"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : chance === "Medium"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-bold ${classes}`}>
      {chance} approval chance
    </span>
  );
}

export default function FinancePage() {
  const [emiForm, setEmiForm] = useState<EmiForm>({
    loanAmount: "850000",
    downPayment: "150000",
    interestRate: "10.5",
    tenureMonths: "60",
    processingFee: "3500",
  });
  const [preApproval, setPreApproval] = useState<PreApprovalForm>({
    fullName: "",
    phone: "",
    city: "Jalandhar",
    monthlyIncome: "85000",
    existingEmi: "12000",
    employmentType: "Salaried",
    cibilRange: "720-779",
    loanType: "Used Car",
    desiredLoanAmount: "800000",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const emiResult = useMemo(() => {
    const grossAmount = parseMoney(emiForm.loanAmount);
    const downPayment = parseMoney(emiForm.downPayment);
    const processingFee = parseMoney(emiForm.processingFee);
    const principal = Math.max(grossAmount - downPayment + processingFee, 0);
    const rate = Number.parseFloat(emiForm.interestRate) || 0;
    const months = Number.parseInt(emiForm.tenureMonths, 10) || 0;
    const monthlyEmi = calculateEmi(principal, rate, months);
    const totalPayable = monthlyEmi * months;
    const totalInterest = Math.max(totalPayable - principal, 0);
    const principalShare = totalPayable > 0 ? (principal / totalPayable) * 100 : 0;
    const interestShare = totalPayable > 0 ? (totalInterest / totalPayable) * 100 : 0;
    let balance = principal;
    const monthlyRate = rate / 12 / 100;
    const schedule = Array.from({ length: Math.min(months, 8) }).map((_, index) => {
      const interest = balance * monthlyRate;
      const principalPaid = Math.max(monthlyEmi - interest, 0);
      balance = Math.max(balance - principalPaid, 0);
      return { month: index + 1, emi: monthlyEmi, principal: principalPaid, interest, balance };
    });
    return { principal, monthlyEmi, totalPayable, totalInterest, principalShare, interestShare, schedule };
  }, [emiForm]);

  const preApprovalResult = useMemo(() => {
    const income = parseMoney(preApproval.monthlyIncome);
    const existingEmi = parseMoney(preApproval.existingEmi);
    const desiredLoan = parseMoney(preApproval.desiredLoanAmount);
    const eligibleEmi = Math.max(income * 0.4 - existingEmi, 0);
    const estimatedEligibleAmount = eligibleEmi * 50;
    const estimatedEmi = calculateEmi(desiredLoan, cibilMidRate[preApproval.cibilRange], 60);
    const approvalChance = getApprovalChance(income, estimatedEmi + existingEmi, preApproval.cibilRange);
    const emiBurdenRatio = income > 0 ? ((estimatedEmi + existingEmi) / income) * 100 : 0;
    return {
      income,
      existingEmi,
      desiredLoan,
      eligibleEmi,
      estimatedEligibleAmount,
      rangeLow: estimatedEligibleAmount * 0.8,
      rangeHigh: estimatedEligibleAmount * 1.2,
      estimatedEmi,
      approvalChance,
      emiBurdenRatio,
      interestRange: cibilInterestRange[preApproval.cibilRange],
    };
  }, [preApproval]);

  const whatsappText = encodeURIComponent(
    `Hi Sangro Finance, my pre-approval estimate is ready.\nName: ${preApproval.fullName}\nPhone: ${preApproval.phone}\nCity: ${preApproval.city}\nLoan type: ${preApproval.loanType}\nDesired loan: ${formatMoney(preApprovalResult.desiredLoan)}\nEligibility estimate: ${formatMoney(preApprovalResult.estimatedEligibleAmount)}\nApproval chance: ${preApprovalResult.approvalChance}`,
  );
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919041322997";

  const submitPreApproval = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitted(false);

    if (!preApproval.fullName.trim() || !preApproval.phone.trim()) {
      setSubmitError("Please enter your name and phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/service-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_type: "finance",
          name: preApproval.fullName.trim(),
          full_name: preApproval.fullName.trim(),
          phone: preApproval.phone.trim(),
          city: preApproval.city.trim(),
          monthly_income: preApprovalResult.income,
          existing_emi: preApprovalResult.existingEmi,
          employment_type: preApproval.employmentType,
          cibil_range: preApproval.cibilRange,
          loan_type: preApproval.loanType,
          desired_loan_amount: preApprovalResult.desiredLoan,
          estimated_eligible_amount: preApprovalResult.estimatedEligibleAmount,
          estimated_interest_range: preApprovalResult.interestRange,
          approval_chance: preApprovalResult.approvalChance,
          message: `Finance pre-approval request. Eligible EMI: ${formatMoney(preApprovalResult.eligibleEmi)}. Estimated EMI: ${formatMoney(preApprovalResult.estimatedEmi)}. EMI burden: ${formatPercent(preApprovalResult.emiBurdenRatio)}.`,
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error || "Could not save finance lead.");
      }
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not submit finance request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <nav className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-black tracking-tight text-slate-950">
            Sangro Finance
          </Link>
          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#emi" className="hover:text-slate-950">EMI Calculator</a>
            <a href="#pre-approval" className="hover:text-slate-950">Pre-Approval</a>
            <a href="#process" className="hover:text-slate-950">Process</a>
          </div>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-950 hover:border-slate-950"
          >
            WhatsApp
          </a>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <div className="mb-5 inline-flex w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            Estimated pre-approval only
          </div>
          <h1 className="max-w-3xl text-5xl font-black tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl">
            Car finance made simple.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            Check your EMI, estimate eligibility, and get pre-approved guidance before buying your next car.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#pre-approval" className="rounded-2xl bg-slate-950 px-6 py-4 text-center text-base font-black text-white shadow-xl shadow-slate-950/10 transition hover:-translate-y-0.5">
              Check Pre-Approval
            </a>
            <a href="#emi" className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center text-base font-black text-slate-950 transition hover:-translate-y-0.5 hover:border-slate-950">
              Calculate EMI
            </a>
          </div>
          <p className="mt-5 max-w-2xl text-sm text-slate-500">
            Estimated pre-approval only. Final approval depends on bank verification.
          </p>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_30px_100px_rgba(15,23,42,0.10)]">
          <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-300">Finance dashboard preview</p>
              <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-200">Pre-approved estimate</span>
            </div>
            <p className="mt-6 text-4xl font-black tracking-tight">{formatMoney(preApprovalResult.estimatedEligibleAmount)}</p>
            <p className="mt-2 text-sm text-slate-300">Estimated loan eligibility based on FOIR logic</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-slate-300">Eligible EMI</p>
                <p className="mt-2 text-xl font-black">{formatMoney(preApprovalResult.eligibleEmi)}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-slate-300">Interest range</p>
                <p className="mt-2 text-xl font-black">{preApprovalResult.interestRange}</p>
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {[
              ["EMI burden ratio", preApprovalResult.emiBurdenRatio],
              ["Safe EMI limit", Math.min((preApprovalResult.eligibleEmi / Math.max(preApprovalResult.income || 1, 1)) * 100, 100)],
              ["Down payment readiness", Math.min((parseMoney(emiForm.downPayment) / Math.max(parseMoney(emiForm.loanAmount), 1)) * 100, 100)],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div className="mb-2 flex justify-between text-sm font-semibold text-slate-700">
                  <span>{label as string}</span>
                  <span>{formatPercent(value as number)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-slate-950" style={{ width: `${Math.min(value as number, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <StatCard label="Loan eligibility" value={formatMoney(preApprovalResult.estimatedEligibleAmount)} helper="FOIR-based estimate" />
        <StatCard label="EMI burden" value={formatPercent(preApprovalResult.emiBurdenRatio)} helper="Good below 40%" />
        <StatCard label="Suggested loan" value={`${formatMoney(preApprovalResult.rangeLow)} - ${formatMoney(preApprovalResult.rangeHigh)}`} helper="±20% range" />
        <StatCard label="Debt health" value={preApprovalResult.approvalChance === "High" ? "Good" : preApprovalResult.approvalChance === "Medium" ? "Watch" : "Risky"} helper="Based on income + CIBIL" />
      </section>

      <section id="emi" className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">EMI Calculator</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Plan the monthly payment before you buy.</h2>
          <p className="mt-4 text-lg leading-7 text-slate-600">Use the standard EMI formula with loan amount, down payment, processing fee, interest rate and tenure.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <StatCard label="Monthly EMI" value={formatMoney(emiResult.monthlyEmi)} />
            <StatCard label="Total interest" value={formatMoney(emiResult.totalInterest)} />
            <StatCard label="Total payable" value={formatMoney(emiResult.totalPayable)} />
            <StatCard label="Financed principal" value={formatMoney(emiResult.principal)} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Loan amount">
              <input className={inputClass} value={emiForm.loanAmount} onChange={(event) => setEmiForm({ ...emiForm, loanAmount: event.target.value })} />
            </Field>
            <Field label="Down payment">
              <input className={inputClass} value={emiForm.downPayment} onChange={(event) => setEmiForm({ ...emiForm, downPayment: event.target.value })} />
            </Field>
            <Field label="Interest rate (%)">
              <input className={inputClass} inputMode="decimal" value={emiForm.interestRate} onChange={(event) => setEmiForm({ ...emiForm, interestRate: event.target.value })} />
            </Field>
            <Field label="Tenure in months">
              <input className={inputClass} inputMode="numeric" value={emiForm.tenureMonths} onChange={(event) => setEmiForm({ ...emiForm, tenureMonths: event.target.value })} />
            </Field>
            <Field label="Processing fee optional">
              <input className={inputClass} value={emiForm.processingFee} onChange={(event) => setEmiForm({ ...emiForm, processingFee: event.target.value })} />
            </Field>
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 p-5">
            <div className="flex h-5 overflow-hidden rounded-full bg-slate-100">
              <div className="bg-slate-950" style={{ width: `${emiResult.principalShare}%` }} />
              <div className="bg-emerald-500" style={{ width: `${emiResult.interestShare}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-950" /> Principal</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-emerald-500" /> Interest</span>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <div className="grid grid-cols-4 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
              <span>Month</span><span>EMI</span><span>Interest</span><span>Balance</span>
            </div>
            {emiResult.schedule.map((row) => (
              <div key={row.month} className="grid grid-cols-4 border-t border-slate-100 px-4 py-3 text-sm text-slate-700">
                <span>{row.month}</span><span>{formatMoney(row.emi)}</span><span>{formatMoney(row.interest)}</span><span>{formatMoney(row.balance)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pre-approval" className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
        <form onSubmit={submitPreApproval} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">Pre-Approval Estimator</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Get a finance estimate.</h2>
            </div>
            <ApprovalBadge chance={preApprovalResult.approvalChance} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input className={inputClass} value={preApproval.fullName} onChange={(event) => setPreApproval({ ...preApproval, fullName: event.target.value })} required />
            </Field>
            <Field label="Phone">
              <input className={inputClass} value={preApproval.phone} onChange={(event) => setPreApproval({ ...preApproval, phone: event.target.value })} required />
            </Field>
            <Field label="City">
              <input className={inputClass} value={preApproval.city} onChange={(event) => setPreApproval({ ...preApproval, city: event.target.value })} />
            </Field>
            <Field label="Monthly income">
              <input className={inputClass} value={preApproval.monthlyIncome} onChange={(event) => setPreApproval({ ...preApproval, monthlyIncome: event.target.value })} />
            </Field>
            <Field label="Existing EMI">
              <input className={inputClass} value={preApproval.existingEmi} onChange={(event) => setPreApproval({ ...preApproval, existingEmi: event.target.value })} />
            </Field>
            <Field label="Employment type">
              <select className={inputClass} value={preApproval.employmentType} onChange={(event) => setPreApproval({ ...preApproval, employmentType: event.target.value as EmploymentType })}>
                <option>Salaried</option><option>Business</option>
              </select>
            </Field>
            <Field label="CIBIL range">
              <select className={inputClass} value={preApproval.cibilRange} onChange={(event) => setPreApproval({ ...preApproval, cibilRange: event.target.value as CibilRange })}>
                <option>780+</option><option>720-779</option><option>680-719</option><option>Below 680</option>
              </select>
            </Field>
            <Field label="Loan type">
              <select className={inputClass} value={preApproval.loanType} onChange={(event) => setPreApproval({ ...preApproval, loanType: event.target.value as LoanType })}>
                <option>Used Car</option><option>New Car</option><option>Personal</option><option>Business</option>
              </select>
            </Field>
            <Field label="Desired loan amount">
              <input className={inputClass} value={preApproval.desiredLoanAmount} onChange={(event) => setPreApproval({ ...preApproval, desiredLoanAmount: event.target.value })} />
            </Field>
          </div>

          {submitError ? <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{submitError}</p> : null}
          {submitted ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              Your pre-approval estimate is ready. Sangro Finance will call you and help process this through our banking partners.
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button disabled={isSubmitting} className="rounded-2xl bg-slate-950 px-6 py-4 font-black text-white disabled:cursor-not-allowed disabled:opacity-60" type="submit">
              {isSubmitting ? "Submitting..." : "Apply Now"}
            </button>
            <a href={`https://wa.me/${whatsappNumber}?text=${whatsappText}`} className="rounded-2xl border border-slate-300 px-6 py-4 text-center font-black text-slate-950 hover:border-slate-950">
              Send details on WhatsApp
            </a>
          </div>
        </form>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-black text-slate-950">Pre-approved estimate</h3>
              <ApprovalBadge chance={preApprovalResult.approvalChance} />
            </div>
            <div className="mt-6 grid gap-4">
              <StatCard label="Estimated eligible amount" value={formatMoney(preApprovalResult.estimatedEligibleAmount)} helper={`${formatMoney(preApprovalResult.rangeLow)} - ${formatMoney(preApprovalResult.rangeHigh)} range`} />
              <StatCard label="Suggested EMI limit" value={formatMoney(preApprovalResult.eligibleEmi)} helper="Monthly income × 40% minus existing EMI" />
              <StatCard label="Estimated interest range" value={preApprovalResult.interestRange} helper="Based on selected CIBIL range" />
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_16px_50px_rgba(15,23,42,0.10)]">
            <h3 className="text-2xl font-black">Documents required</h3>
            <div className="mt-5 grid gap-3">
              {documents.map((document) => (
                <div key={document} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-slate-100">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-400 text-slate-950">✓</span>
                  {document}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">Bank partner process</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">From estimate to bank review.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {processSteps.map((step, index) => (
              <div key={step} className="rounded-3xl border border-slate-200 bg-white p-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-950 text-sm font-black text-white">{index + 1}</span>
                <p className="mt-4 text-base font-black text-slate-950">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
          <strong>Disclaimer:</strong> Sangro Finance does not guarantee loan approval. Final approval, interest rate, and disbursal are subject to bank/NBFC checks, documents, credit score, and policies.
        </div>
      </section>
    </main>
  );
}
