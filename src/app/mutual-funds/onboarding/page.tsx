"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";

type GoalOption = "Wealth Creation" | "Retirement" | "Child Education" | "Tax Saving";
type InvestmentType = "Monthly SIP" | "One Time" | "Both";

type FormState = {
  phone: string;
  fullName: string;
  email: string;
  city: string;
  goal: GoalOption | "";
  investmentType: InvestmentType | "";
  sipAmount: string;
  oneTimeAmount: string;
};

const goals: GoalOption[] = [
  "Wealth Creation",
  "Retirement",
  "Child Education",
  "Tax Saving",
];

const stepMeta = [
  { title: "Phone number", caption: "We’ll use this to connect you with Sangro Wealth." },
  { title: "Basic details", caption: "Tell us who should get onboarding updates." },
  { title: "Investment goal", caption: "Choose why you’re planning to invest." },
  { title: "Investment plan", caption: "Tell us whether you prefer SIP, one-time, or both." },
];

const whatsappLink = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919041322997"}?text=${encodeURIComponent(
  "Hi Sangro Wealth, I want mutual fund early access."
)}`;

const fade = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function MutualFundsOnboardingPage() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);
  const [form, setForm] = useState<FormState>({
    phone: "",
    fullName: "",
    email: "",
    city: "",
    goal: "",
    investmentType: "",
    sipAmount: "",
    oneTimeAmount: "",
  });

  const progress = useMemo(() => ((step + (complete ? 1 : 0)) / stepMeta.length) * 100, [complete, step]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const goNext = async () => {
    setError(null);

    if (step === 0 && form.phone.replace(/\D/g, "").length < 10) {
      setError("Enter a valid phone number to continue.");
      return;
    }

    if (step === 1 && (!form.fullName.trim() || !form.email.trim())) {
      setError("Full name and email are required.");
      return;
    }

    if (step === 2 && !form.goal) {
      setError("Please select your primary investment goal.");
      return;
    }

    if (step === 3) {
      const needsSip = form.investmentType === "Monthly SIP" || form.investmentType === "Both";
      const needsOneTime = form.investmentType === "One Time" || form.investmentType === "Both";
      const sipValue = Number.parseFloat(form.sipAmount.replace(/,/g, "") || "0");
      const oneTimeValue = Number.parseFloat(form.oneTimeAmount.replace(/,/g, "") || "0");

      if (!form.investmentType) {
        setError("Select your investment type.");
        return;
      }

      if (needsSip && (!Number.isFinite(sipValue) || sipValue <= 0)) {
        setError("Enter a monthly SIP amount greater than zero.");
        return;
      }

      if (needsOneTime && (!Number.isFinite(oneTimeValue) || oneTimeValue <= 0)) {
        setError("Enter a one-time investment amount greater than zero.");
        return;
      }

      setSubmitting(true);
      try {
        const monthlySipAmount = needsSip ? sipValue : null;
        const oneTimeAmount = needsOneTime ? oneTimeValue : null;
        const response = await fetch("/api/service-leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_type: "mutual_funds",
            name: form.fullName.trim(),
            full_name: form.fullName.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            city: form.city.trim(),
            investment_goal: form.goal,
            investment_type: form.investmentType,
            monthly_sip_amount: monthlySipAmount,
            one_time_amount: oneTimeAmount,
            message: [
              "Mutual funds early access",
              `Email: ${form.email.trim()}`,
              form.city.trim() ? `City: ${form.city.trim()}` : null,
              `Goal: ${form.goal}`,
              `Investment type: ${form.investmentType}`,
              monthlySipAmount ? `Monthly SIP: ₹${monthlySipAmount.toLocaleString("en-IN")}` : null,
              oneTimeAmount ? `One-time investment: ₹${oneTimeAmount.toLocaleString("en-IN")}` : null,
            ]
              .filter(Boolean)
              .join(" | "),
          }),
        });

        if (!response.ok) {
          throw new Error("Service lead request failed");
        }

        setComplete(true);
      } catch (submissionError) {
        console.error("Wealth onboarding failed", submissionError);
        setError("Something went wrong. Please try again or contact us on WhatsApp.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setStep((current) => Math.min(current + 1, stepMeta.length - 1));
  };

  const goBack = () => {
    setError(null);
    setStep((current) => Math.max(current - 1, 0));
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.14),transparent_28%),linear-gradient(180deg,#f5fff9_0%,#ffffff_30%)] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-emerald-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/mutual-funds" className="flex items-center gap-3">
            <img
              src="/images/sangrocars-logo.png"
              alt="Sangro"
              className="h-11 w-11 rounded-2xl border border-emerald-100 object-contain p-1"
            />
            <div>
              <div className="text-lg font-semibold tracking-tight">Sangro Wealth</div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-500">Early access onboarding</div>
            </div>
          </Link>
          <Link
            href="/mutual-funds"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            Back to Mutual Funds
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]"
        >
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
              Get early access
            </span>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Your Sangro Wealth onboarding starts here.
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-600">
                We’re opening mutual fund access in a guided way. Share your goal and SIP intent,
                and we’ll keep your setup ready as investing goes live.
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Progress</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">
                    {complete ? "Early access enabled" : `Step ${step + 1} of ${stepMeta.length}`}
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-green-500"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
              <div className="mt-5 space-y-3">
                {stepMeta.map((item, index) => {
                  const active = !complete && index === step;
                  const done = complete || index < step;
                  return (
                    <div
                      key={item.title}
                      className={`rounded-2xl border px-4 py-3 transition ${
                        active
                          ? "border-emerald-300 bg-emerald-50"
                          : done
                            ? "border-slate-200 bg-white"
                            : "border-slate-100 bg-slate-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                            done ? "bg-emerald-600 text-white" : active ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {done ? "✓" : index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.caption}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <AnimatePresence mode="wait">
              {complete ? (
                <motion.div
                  key="complete"
                  {...fade}
                  transition={{ duration: 0.35 }}
                  className="flex min-h-[500px] flex-col items-center justify-center text-center"
                >
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 220, damping: 16 }}
                    className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-700 shadow-[0_16px_40px_rgba(34,197,94,0.18)]"
                  >
                    ✓
                  </motion.div>
                  <h2 className="mt-8 text-3xl font-semibold tracking-tight">Early Access Enabled</h2>
                  <p className="mt-4 max-w-md text-base leading-7 text-slate-600">
                    Sangro Wealth will contact you soon. We’ve saved your onboarding details and
                    will reach out with the next steps.
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(34,197,94,0.25)] transition hover:-translate-y-0.5"
                    >
                      Connect on WhatsApp
                    </a>
                    <Link
                      href="/mutual-funds"
                      className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-emerald-300 hover:text-emerald-700"
                    >
                      Back to tracker
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`step-${step}`}
                  {...fade}
                  transition={{ duration: 0.3 }}
                  className="min-h-[500px]"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Step {step + 1}
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      {stepMeta[step].title}
                    </h2>
                    <p className="mt-3 text-base leading-7 text-slate-600">
                      {stepMeta[step].caption}
                    </p>
                  </div>

                  <div className="mt-8 space-y-5">
                    {step === 0 ? (
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-slate-700">Phone number</span>
                        <input
                          value={form.phone}
                          onChange={(event) => updateField("phone", event.target.value)}
                          placeholder="e.g. 9041322997"
                          inputMode="tel"
                          className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-base text-slate-950 outline-none transition focus:border-emerald-400"
                        />
                      </label>
                    ) : null}

                    {step === 1 ? (
                      <div className="grid gap-4">
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-slate-700">Full name</span>
                          <input
                            value={form.fullName}
                            onChange={(event) => updateField("fullName", event.target.value)}
                            placeholder="Enter your full name"
                            className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-base text-slate-950 outline-none transition focus:border-emerald-400"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-slate-700">Email</span>
                          <input
                            value={form.email}
                            onChange={(event) => updateField("email", event.target.value)}
                            placeholder="Enter your email"
                            inputMode="email"
                            className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-base text-slate-950 outline-none transition focus:border-emerald-400"
                          />
                        </label>
                        <label className="block">
                          <span className="mb-2 block text-sm font-semibold text-slate-700">City</span>
                          <input
                            value={form.city}
                            onChange={(event) => updateField("city", event.target.value)}
                            placeholder="e.g. Jalandhar"
                            className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-base text-slate-950 outline-none transition focus:border-emerald-400"
                          />
                        </label>
                      </div>
                    ) : null}

                    {step === 2 ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {goals.map((goal) => {
                          const selected = form.goal === goal;
                          return (
                            <button
                              key={goal}
                              type="button"
                              onClick={() => updateField("goal", goal)}
                              className={`rounded-[24px] border px-4 py-5 text-left transition ${
                                selected
                                  ? "border-emerald-400 bg-emerald-50 shadow-[0_12px_28px_rgba(34,197,94,0.12)]"
                                  : "border-slate-200 bg-white hover:border-emerald-300"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-base font-semibold text-slate-950">{goal}</span>
                                <span
                                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${
                                    selected
                                      ? "border-emerald-500 bg-emerald-600 text-white"
                                      : "border-slate-300 text-slate-400"
                                  }`}
                                >
                                  {selected ? "✓" : ""}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {step === 3 ? (
                      <div className="space-y-4">
                        <div>
                          <p className="mb-3 text-sm font-semibold text-slate-700">Investment type</p>
                          <div className="grid gap-3 sm:grid-cols-3">
                            {([
                              ["Monthly SIP", "Invest every month"],
                              ["One Time", "Invest one amount"],
                              ["Both", "SIP + one-time"],
                            ] as const).map(([type, caption]) => {
                              const selected = form.investmentType === type;
                              return (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => updateField("investmentType", type)}
                                  className={`rounded-[22px] border px-4 py-4 text-left transition ${
                                    selected
                                      ? "border-emerald-400 bg-emerald-50 shadow-[0_12px_28px_rgba(34,197,94,0.12)]"
                                      : "border-slate-200 bg-white hover:border-emerald-300"
                                  }`}
                                >
                                  <span className="block text-sm font-semibold text-slate-950">{type}</span>
                                  <span className="mt-1 block text-xs text-slate-500">{caption}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {(form.investmentType === "Monthly SIP" || form.investmentType === "Both") ? (
                          <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">Monthly SIP amount</span>
                            <input
                              value={form.sipAmount}
                              onChange={(event) => updateField("sipAmount", event.target.value)}
                              placeholder="e.g. 5000"
                              inputMode="numeric"
                              className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-base text-slate-950 outline-none transition focus:border-emerald-400"
                            />
                          </label>
                        ) : null}

                        {(form.investmentType === "One Time" || form.investmentType === "Both") ? (
                          <label className="block">
                            <span className="mb-2 block text-sm font-semibold text-slate-700">One-time investment amount</span>
                            <input
                              value={form.oneTimeAmount}
                              onChange={(event) => updateField("oneTimeAmount", event.target.value)}
                              placeholder="e.g. 50000"
                              inputMode="numeric"
                              className="w-full rounded-2xl border border-slate-200 px-4 py-4 text-base text-slate-950 outline-none transition focus:border-emerald-400"
                            />
                          </label>
                        ) : null}

                        <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-5">
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                            Your setup preview
                          </p>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-white p-4">
                              <p className="text-sm text-slate-500">Goal</p>
                              <p className="mt-2 text-lg font-semibold text-slate-950">{form.goal || "Not selected"}</p>
                            </div>
                            <div className="rounded-2xl bg-white p-4">
                              <p className="text-sm text-slate-500">Investment type</p>
                              <p className="mt-2 text-lg font-semibold text-slate-950">{form.investmentType || "Not selected"}</p>
                            </div>
                            <div className="rounded-2xl bg-white p-4">
                              <p className="text-sm text-slate-500">Monthly SIP</p>
                              <p className="mt-2 text-lg font-semibold text-slate-950">
                                ₹{Number.parseFloat(form.sipAmount || "0").toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div className="rounded-2xl bg-white p-4">
                              <p className="text-sm text-slate-500">One-time</p>
                              <p className="mt-2 text-lg font-semibold text-slate-950">
                                ₹{Number.parseFloat(form.oneTimeAmount || "0").toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {error ? (
                    <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {error}
                    </div>
                  ) : null}

                  <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      disabled={step === 0 || submitting}
                      className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      disabled={submitting}
                      className="rounded-full bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(34,197,94,0.25)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? "Saving..." : step === stepMeta.length - 1 ? "Enable Early Access" : "Continue"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
