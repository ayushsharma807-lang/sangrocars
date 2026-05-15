"use client";

import { FormEvent, useMemo, useState } from "react";
import { getPublicApiUrl } from "@/lib/publicApi";

type ServiceType = "finance" | "insurance" | "mutual_funds" | "properties" | "cars";

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success" }
  | { state: "error"; message: string };

type Props = {
  serviceType: ServiceType;
  title: string;
  description: string;
  submitLabel: string;
  messagePlaceholder: string;
  defaultMessage?: string;
  id?: string;
};

const SERVICE_TITLES: Record<ServiceType, string> = {
  finance: "Finance support",
  insurance: "Insurance support",
  mutual_funds: "Mutual funds support",
  properties: "Property support",
  cars: "Used cars support",
};

export default function ServiceLeadForm({
  serviceType,
  title,
  description,
  submitLabel,
  messagePlaceholder,
  defaultMessage,
  id,
}: Props) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [message, setMessage] = useState(defaultMessage ?? "");

  const endpoint = useMemo(() => getPublicApiUrl("/api/service-leads"), []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ state: "loading" });
    const formData = new FormData(event.currentTarget);

    const payload = {
      service_type: serviceType,
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      message: message.trim(),
    };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Service lead submit failed", {
          status: res.status,
          data,
          payload,
        });
        setStatus({
          state: "error",
          message: data?.error ?? "Could not send your request right now.",
        });
        return;
      }

      setStatus({ state: "success" });
      event.currentTarget.reset();
      setMessage(defaultMessage ?? "");
    } catch (error) {
      console.error("Service lead submit crashed", { error, endpoint, payload });
      setStatus({
        state: "error",
        message: "Network error. Please try again.",
      });
    }
  };

  return (
    <section className="service-page__card service-lead-form" id={id}>
      <div className="service-page__hero service-lead-form__header">
        <p className="service-page__eyebrow">{SERVICE_TITLES[serviceType]}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <form className="cw-contact-form" onSubmit={handleSubmit}>
        <div className="cw-contact-form__grid">
          <label>
            Name
            <input name="name" required placeholder="Your name" />
          </label>
          <label>
            Phone number
            <input name="phone" required placeholder="e.g. 9041322997" inputMode="tel" />
          </label>
        </div>
        <label>
          City
          <input name="city" placeholder="e.g. Jalandhar" />
        </label>
        <label>
          Message
          <textarea
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={messagePlaceholder}
            rows={5}
          />
        </label>
        <button className="simple-button cw-contact-form__submit" type="submit" disabled={status.state === "loading"}>
          {status.state === "loading" ? "Sending..." : submitLabel}
        </button>
        {status.state === "success" && (
          <p className="cw-contact-form__success">
            Thanks — Sangro will contact you shortly.
          </p>
        )}
        {status.state === "error" && (
          <p className="cw-contact-form__error">{status.message}</p>
        )}
      </form>
    </section>
  );
}
