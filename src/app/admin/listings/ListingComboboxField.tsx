"use client";

import { useId } from "react";

type ListingComboboxFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
};

export default function ListingComboboxField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  required,
  disabled,
}: ListingComboboxFieldProps) {
  const listId = useId();
  const normalizedValue = value.trim().toLowerCase();
  const filteredOptions = options
    .filter((option, index, all) => all.indexOf(option) === index)
    .filter((option) => {
      if (!normalizedValue) return true;
      return option.toLowerCase().includes(normalizedValue);
    })
    .slice(0, 12);

  return (
    <label>
      {label}
      <input
        name={name}
        list={listId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
      />
      <datalist id={listId}>
        {filteredOptions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );
}
