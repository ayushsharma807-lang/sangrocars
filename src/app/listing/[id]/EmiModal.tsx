"use client";

import { useState } from "react";
import EmiCalculator from "./EmiCalculator";
import SimpleModal from "./SimpleModal";

type Props = {
  price: number | null;
};

export default function EmiModal({ price }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="simple-button simple-button--secondary"
        onClick={() => setOpen(true)}
      >
        Calculate EMI
      </button>
      <SimpleModal open={open} title="EMI Calculator" onClose={() => setOpen(false)}>
        <EmiCalculator price={price} />
      </SimpleModal>
    </>
  );
}
