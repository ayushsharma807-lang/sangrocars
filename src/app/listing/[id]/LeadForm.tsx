"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPublicApiUrl } from "@/lib/publicApi";

type Props = {
  listingId: string;
  dealerId: string | null;
  listingTitle: string;
  defaultIntent?: string;
};

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success" }
  | { state: "error"; message: string };

export default function LeadForm({
  listingId,
  dealerId,
  listingTitle,
  defaultIntent,
}: Props) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const searchParams = useSearchParams();
  const [intent, setIntent] = useState(defaultIntent ?? "callback");
  const [wantsFinance, setWantsFinance] = useState(
    defaultIntent === "finance"
  );

  useEffect(() => {
    if (defaultIntent) {
      setIntent(defaultIntent);
      setWantsFinance(defaultIntent === "finance");
      return;
    }
    const param = searchParams.get("intent");
    if (param) {
      setIntent(param);
      setWantsFinance(param === "finance");
      return;
    }
  }, [searchParams, defaultIntent]);

  const buildMessage = (payload: Record<string, FormDataEntryValue>) => {
    const parts: string[] = [];
    const preferredTime = String(payload.message ?? "").trim();
    if (preferredTime) {
      parts.push(`Preferred time: ${preferredTime}`);
    }

    const intentValue = String(payload.intent ?? "callback");
    if (intentValue) {
      parts.push(`Intent: ${intentValue.replace(/_/g, " ")}`);
    }
    if (String(payload.want_finance ?? "no") === "yes" || intentValue === "finance") {
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
    const wantsFinanceRequest =
      String(payload.want_finance ?? "no") === "yes" ||
      String(payload.intent ?? "") === "finance";
    const source = String(payload.intent ?? "") || (wantsFinanceRequest ? "finance" : "website");

    try {
      const endpoint = getPublicApiUrl("/api/leads");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          dealer_id: dealerId,
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          message: buildMessage(payload),
          source,
          listing_title: listingTitle,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Lead form submit failed", {
          status: res.status,
          data,
          endpoint,
          listingId,
        });
        setStatus({
          state: "error",
          message: data?.error ?? "Failed to submit. Try again.",
        });
        return;
      }
    } catch (error) {
      console.error("Lead form submit crashed", {
        error,
        endpoint: getPublicApiUrl("/api/leads"),
        host: typeof window !== "undefined" ? window.location.host : null,
        listingId,
      });
      setStatus({
        state: "error",
        message: "Network error. Please try again.",
      });
      return;
    }

    setStatus({ state: "success" });
    setIntent(defaultIntent ?? "callback");
    setWantsFinance(defaultIntent === "finance");
    event.currentTarget.reset();
  };

  return (
    <form className="lead-form" id="lead-form" onSubmit={handleSubmit}>
      <div className="lead-form__header">
        <h3>Contact Sangro</h3>
        <p>We will negotiate the best deal and connect you with verified sellers.</p>
      </div>
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
          How can we help?
          <select
            name="intent"
            value={intent}
            onChange={(event) => {
              const value = event.target.value;
              setIntent(value);
              setWantsFinance(value === "finance");
            }}
          >
            <option value="callback">Request callback</option>
            <option value="best_price">Request best price</option>
            <option value="finance">Finance this car</option>
            <option value="insurance">Get insurance quote</option>
          </select>
        </label>
        <label>
          Need finance help?
          <select
            name="want_finance"
            value={wantsFinance ? "yes" : "no"}
            onChange={(event) => setWantsFinance(event.target.value === "yes")}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
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
        {status.state === "loading" ? "Sending..." : "Send request"}
      </button>
      {status.state === "success" && (
        <p className="lead-form__success">
          Thanks! Sangro will reach out shortly.
        </p>
      )}
      {status.state === "error" && (
        <p className="lead-form__error">{status.message}</p>
      )}
    </form>
  );
}
