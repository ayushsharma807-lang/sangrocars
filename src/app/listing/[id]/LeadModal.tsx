"use client";

import { useState } from "react";
import LeadForm from "./LeadForm";
import SimpleModal from "./SimpleModal";

type Props = {
  label: string;
  listingId: string;
  dealerId: string | null;
  listingTitle: string;
  defaultIntent?: string;
  variant?: "primary" | "secondary";
};

export default function LeadModal({
  label,
  listingId,
  dealerId,
  listingTitle,
  defaultIntent = "callback",
  variant = "secondary",
}: Props) {
  const [open, setOpen] = useState(false);
  const buttonClass =
    variant === "primary" ? "simple-button" : "simple-button simple-button--secondary";

  return (
    <>
      <button type="button" className={buttonClass} onClick={() => setOpen(true)}>
        {label}
      </button>
      <SimpleModal
        open={open}
        title="Contact Sangro"
        onClose={() => setOpen(false)}
      >
        <LeadForm
          listingId={listingId}
          dealerId={dealerId}
          listingTitle={listingTitle}
          defaultIntent={defaultIntent}
        />
      </SimpleModal>
    </>
  );
}
