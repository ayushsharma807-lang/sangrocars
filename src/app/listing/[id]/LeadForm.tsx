"use client";

import { FormEvent, useState } from "react";

type Props = {
  listingId: string;
  dealerId: string | null;
  listingTitle: string;
};

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success" }
  | { state: "error"; message: string };

export default function LeadForm({ listingId, dealerId, listingTitle }: Props) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [wantsFinance, setWantsFinance] = useState(false);

  const buildMessage = (payload: Record<string, FormDataEntryValue>) => {
    const parts: string[] = [];
    const preferredTime = String(payload.message ?? "").trim();
    if (preferredTime) {
      parts.push(`Preferred time: ${preferredTime}`);
    }

    if (String(payload.want_finance ?? "no") === "yes") {
      parts.push("Finance request: Yes");
      const downPayment = String(payload.down_payment ?? "").trim();
      const monthlyBudget = String(payload.monthly_budget ?? "").trim();
      const tenureMonths = String(payload.tenure_months ?? "").trim();
      if (downPayment) parts.push(`Down payment: ${downPayment}`);
      if (monthlyBudget) parts.push(`Monthly budget: ${monthlyBudget}`);
      if (tenureMonths) parts.push(`Tenure: ${tenureMonths} months`);
    }

    return parts.join(" | ");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ state: "loading" });
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(
      formData.entries()
    ) as Record<string, FormDataEntryValue>;
    const wantsFinanceRequest = String(payload.want_finance ?? "no") === "yes";

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          dealer_id: dealerId,
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          message: buildMessage(payload),
          source: wantsFinanceRequest ? "finance" : "website",
          listing_title: listingTitle,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus({
          state: "error",
          message: data?.error ?? "Failed to submit. Try again.",
        });
        return;
      }
    } catch {
      setStatus({
        state: "error",
        message: "Network error. Please try again.",
      });
      return;
    }

    setStatus({ state: "success" });
    setWantsFinance(false);
    event.currentTarget.reset();
  };

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <div className="lead-form__row">
        <label>
          Name
          <input name="name" required placeholder="Your full name" />
        </label>
        <label>
          Phone
          <input name="phone" required placeholder="+91 9xxxx-xxxxx" />
        </label>
      </div>
      <div className="lead-form__row">
        <label>
          Email
          <input name="email" type="email" placeholder="name@email.com" />
        </label>
        <label>
          Preferred time
          <input name="message" placeholder="e.g., Today after 5pm" />
        </label>
      </div>
      <div className="lead-form__row">
        <label>
          Need finance help?
          <select
            name="want_finance"
            defaultValue="no"
            onChange={(event) => setWantsFinance(event.target.value === "yes")}
          >
            <option value="no">No, just callback</option>
            <option value="yes">Yes, need finance option</option>
          </select>
        </label>
      </div>
      {wantsFinance && (
        <div className="lead-form__row">
          <label>
            Down payment (Rs)
            <input name="down_payment" placeholder="e.g., 5,00,000" />
          </label>
          <label>
            Monthly budget (Rs)
            <input name="monthly_budget" placeholder="e.g., 35,000" />
          </label>
          <label>
            Tenure
            <select name="tenure_months" defaultValue="60">
              <option value="36">36 months</option>
              <option value="48">48 months</option>
              <option value="60">60 months</option>
              <option value="72">72 months</option>
              <option value="84">84 months</option>
            </select>
          </label>
        </div>
      )}
      <button
        className="btn btn--solid"
        type="submit"
        disabled={status.state === "loading"}
      >
        {status.state === "loading" ? "Sending..." : "Request callback"}
      </button>
      {status.state === "success" && (
        <p className="lead-form__success">
          Thanks! A dealer will reach out shortly.
        </p>
      )}
      {status.state === "error" && (
        <p className="lead-form__error">{status.message}</p>
      )}
    </form>
  );
}
