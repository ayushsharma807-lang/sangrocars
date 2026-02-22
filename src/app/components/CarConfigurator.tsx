"use client";

import { useMemo, useState } from "react";

type Props = {
  basePrice: number | null;
  title: string;
  listingId?: string;
};

type Accessory = {
  id: string;
  label: string;
  price: number;
};

const STORAGE_KEY = "carhub:garage:configs";

const trims = [
  { id: "standard", label: "Standard", delta: 0 },
  { id: "sport", label: "Sport", delta: 125_000 },
  { id: "signature", label: "Signature", delta: 285_000 },
];

const colors = [
  { id: "solid-black", label: "Solid Black", delta: 0 },
  { id: "pearl-white", label: "Pearl White", delta: 18_000 },
  { id: "metallic-blue", label: "Metallic Blue", delta: 22_000 },
  { id: "matte-grey", label: "Matte Grey", delta: 34_000 },
];

const accessories: Accessory[] = [
  { id: "sunroof", label: "Panoramic Sunroof", price: 68_000 },
  { id: "adas", label: "ADAS Safety Pack", price: 95_000 },
  { id: "audio", label: "Premium 12-speaker Audio", price: 48_000 },
  { id: "wheels", label: "19 inch Alloy Wheels", price: 39_000 },
];

const formatInr = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;

export default function CarConfigurator({ basePrice, title, listingId }: Props) {
  const [trim, setTrim] = useState(trims[0].id);
  const [color, setColor] = useState(colors[0].id);
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saved">("idle");

  const trimPrice = trims.find((item) => item.id === trim)?.delta ?? 0;
  const colorPrice = colors.find((item) => item.id === color)?.delta ?? 0;
  const accessoriesPrice = accessories
    .filter((item) => selectedAccessories.includes(item.id))
    .reduce((sum, item) => sum + item.price, 0);
  const effectiveBase = basePrice ?? 1_000_000;
  const finalPrice = effectiveBase + trimPrice + colorPrice + accessoriesPrice;

  const summary = useMemo(
    () => ({
      trim: trims.find((item) => item.id === trim)?.label ?? "Standard",
      color: colors.find((item) => item.id === color)?.label ?? "Solid Black",
      accessories: accessories
        .filter((item) => selectedAccessories.includes(item.id))
        .map((item) => item.label),
    }),
    [trim, color, selectedAccessories]
  );

  const toggleAccessory = (id: string) => {
    setSelectedAccessories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const saveConfiguration = () => {
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEY);
      const existing = existingRaw ? (JSON.parse(existingRaw) as unknown[]) : [];
      const next = [
        {
          id: crypto.randomUUID(),
          listingId: listingId ?? null,
          title,
          trim: summary.trim,
          color: summary.color,
          accessories: summary.accessories,
          price: finalPrice,
          savedAt: new Date().toISOString(),
        },
        ...existing,
      ].slice(0, 40);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setSaveState("idle");
    }
  };

  return (
    <div className="experience-builder">
      <div className="experience-builder__grid">
        <label>
          Trim
          <select value={trim} onChange={(event) => setTrim(event.target.value)}>
            {trims.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} ({item.delta === 0 ? "Included" : `+ ${formatInr(item.delta)}`})
              </option>
            ))}
          </select>
        </label>
        <label>
          Color
          <select value={color} onChange={(event) => setColor(event.target.value)}>
            {colors.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} ({item.delta === 0 ? "Included" : `+ ${formatInr(item.delta)}`})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="experience-builder__addons">
        {accessories.map((item) => {
          const selected = selectedAccessories.includes(item.id);
          return (
            <button
              className={`experience-chip ${selected ? "is-active" : ""}`}
              key={item.id}
              type="button"
              onClick={() => toggleAccessory(item.id)}
            >
              {item.label} ({formatInr(item.price)})
            </button>
          );
        })}
      </div>

      <div className="experience-builder__summary">
        <p>
          Configured estimate: <strong>{formatInr(finalPrice)}</strong>
        </p>
        <div className="experience-builder__actions">
          <button className="simple-button simple-button--secondary" onClick={saveConfiguration} type="button">
            {saveState === "saved" ? "Saved to My Garage" : "Save config"}
          </button>
        </div>
      </div>
    </div>
  );
}
