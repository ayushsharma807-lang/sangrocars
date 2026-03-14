"use client";

import { FormEvent, useState } from "react";

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success" }
  | { state: "error"; message: string };

type Props = {
  source?: string;
};

export default function ContactForm({ source = "contact_page" }: Props) {
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ state: "loading" });
    const formData = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          phone: formData.get("phone"),
          email: "support@sangrocars.in",
          message: String(formData.get("message") ?? "").trim(),
          source,
          listing_title: "General SangroCars contact",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus({
          state: "error",
          message: data?.error ?? "Could not send your message right now.",
        });
        return;
      }

      setStatus({ state: "success" });
      event.currentTarget.reset();
    } catch {
      setStatus({
        state: "error",
        message: "Network error. Please try again.",
      });
    }
  };

  return (
    <form className="cw-contact-form" onSubmit={handleSubmit}>
      <div className="cw-contact-form__grid">
        <label>
          Name
          <input name="name" required placeholder="Your name" />
        </label>
        <label>
          Phone number
          <input name="phone" required placeholder="e.g., 9041322997" />
        </label>
      </div>
      <label>
        Message
        <textarea
          name="message"
          required
          placeholder="Tell us how we can help with buying or selling a car."
          rows={5}
        />
      </label>
      <button className="simple-button cw-contact-form__submit" type="submit" disabled={status.state === "loading"}>
        {status.state === "loading" ? "Sending..." : "Submit"}
      </button>
      {status.state === "success" && (
        <p className="cw-contact-form__success">Thanks! We’ll get back to you soon.</p>
      )}
      {status.state === "error" && (
        <p className="cw-contact-form__error">{status.message}</p>
      )}
    </form>
  );
}
