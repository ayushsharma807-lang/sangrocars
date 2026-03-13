export const formatPriceCompact = (value: number | null) => {
  if (!value) return "Price on request";

  if (value >= 10_000_000) {
    const crores = value / 10_000_000;
    return `₹${stripTrailingZeroes(crores.toFixed(2))} Cr`;
  }

  if (value >= 100_000) {
    const lakhs = value / 100_000;
    return `₹${stripTrailingZeroes(lakhs.toFixed(2))} Lakh`;
  }

  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `₹${stripTrailingZeroes(thousands.toFixed(1))}K`;
  }

  return `₹${value.toLocaleString("en-IN")}`;
};

export const titleCase = (value: string | null) => {
  if (!value) return null;
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export const formatLocationTitle = (value?: string | null) => {
  if (!value) return null;
  return value
    .split(",")
    .map((part) => titleCase(part.trim()) ?? part.trim())
    .filter(Boolean)
    .join(", ");
};

export const formatCityTitle = (value?: string | null) => {
  if (!value) return null;
  const city = value.split(",")[0]?.trim();
  return city ? titleCase(city) : null;
};

export const formatKm = (value: number | null) =>
  value ? `${value.toLocaleString("en-IN")} km` : "Km on request";

export const isNewArrival = (createdAt?: string | null, days = 7) => {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;
  return Date.now() - created <= days * 24 * 60 * 60 * 1000;
};

const stripTrailingZeroes = (value: string) =>
  value.replace(/\.00$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
