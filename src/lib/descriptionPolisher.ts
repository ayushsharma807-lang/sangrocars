type PolisherInput = {
  make?: string | null;
  model?: string | null;
  variant?: string | null;
  year?: string | number | null;
  price?: string | number | null;
  km?: string | number | null;
  fuel?: string | null;
  transmission?: string | null;
  location?: string | null;
  condition?: string | null;
  notes?: string | null;
};

const toTitle = (value?: string | null) =>
  value
    ? value
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "";

const parseNumber = (value?: string | number | null) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const formatInr = (value?: string | number | null) => {
  const num = parseNumber(value);
  if (!num) return null;
  return `₹${Math.round(num).toLocaleString("en-IN")}`;
};

export const buildPolishedDescription = (input: PolisherInput) => {
  const title = [
    input.year ? String(input.year).trim() : null,
    toTitle(input.make),
    toTitle(input.model),
    toTitle(input.variant),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  const facts: string[] = [];
  const price = formatInr(input.price);
  const km = parseNumber(input.km);
  const fuel = toTitle(input.fuel);
  const transmission = toTitle(input.transmission);
  const condition = toTitle(input.condition);
  const location = toTitle(input.location);

  if (price) facts.push(`Price: ${price}`);
  if (km) facts.push(`KM: ${Math.round(km).toLocaleString("en-IN")}`);
  if (fuel) facts.push(`Fuel: ${fuel}`);
  if (transmission) facts.push(`Transmission: ${transmission}`);
  if (condition) facts.push(`Condition: ${condition}`);
  if (location) facts.push(`Location: ${location}`);

  const lines: string[] = [];
  if (title) lines.push(title);
  if (facts.length) lines.push(facts.join(" | "));

  const notes = (input.notes ?? "").trim();
  if (notes) {
    lines.push("");
    lines.push(notes);
  }

  return lines.join("\n").trim();
};
