"use client";

import { useState } from "react";

export default function SellSubmittedPopup({ listingId }: { listingId?: string }) {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div className="sell-success-modal" role="dialog" aria-modal="true" aria-labelledby="sell-success-title">
      <div className="sell-success-modal__backdrop" onClick={() => setOpen(false)} />
      <div className="sell-success-modal__panel">
        <button
          type="button"
          className="sell-success-modal__close"
          aria-label="Close message"
          onClick={() => setOpen(false)}
        >
          x
        </button>
        <p className="sell-success-modal__eyebrow">Submission received</p>
        <h3 id="sell-success-title">Your car is waiting for approval</h3>
        <p>
          We received your listing. Please wait while our team reviews it. We will update you soon.
        </p>
        <p>If you entered an email address, Sangro has also sent you a confirmation email.</p>
        {listingId ? (
          <p className="sell-success-modal__ref">Reference ID: {listingId}</p>
        ) : null}
        <button type="button" className="simple-button" onClick={() => setOpen(false)}>
          Okay
        </button>
      </div>
    </div>
  );
}
