"use client";

import { useEffect, useRef } from "react";

type Props = {
  formId: string;
  name?: string;
};

export default function BulkSelectAll({ formId, name = "ids" }: Props) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!form) return;
    const boxes = Array.from(
      form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)
    );

    const updateState = () => {
      const total = boxes.filter((box) => !box.disabled).length;
      const selected = boxes.filter((box) => box.checked).length;
      const allChecked = total > 0 && selected === total;
      const noneChecked = selected === 0;
      if (checkboxRef.current) {
        checkboxRef.current.checked = allChecked;
        checkboxRef.current.indeterminate = !allChecked && !noneChecked;
      }
    };

    boxes.forEach((box) => box.addEventListener("change", updateState));
    updateState();

    return () => {
      boxes.forEach((box) => box.removeEventListener("change", updateState));
    };
  }, [formId, name]);

  const toggleAll = (checked: boolean) => {
    const form = document.getElementById(formId);
    if (!form) return;
    const boxes = Array.from(
      form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)
    );
    boxes.forEach((box) => {
      if (!box.disabled) {
        box.checked = checked;
        box.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  };

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      aria-label="Select all leads"
      onChange={(event) => toggleAll(event.target.checked)}
    />
  );
}
