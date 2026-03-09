const cleanNumeric = (value: string) => {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseIndianMoney = (value: string | null | undefined) => {
  if (!value) return null;
  const lower = String(value).trim().toLowerCase();
  if (!lower) return null;

  const numeric = cleanNumeric(lower);
  if (numeric == null) return null;

  if (/(crore|crores|cr)\b/.test(lower)) {
    return Math.round(numeric * 10_000_000);
  }

  if (/(lakh|lakhs|lac|lacs)\b/.test(lower) || /\bl\b/.test(lower)) {
    return Math.round(numeric * 100_000);
  }

  if (/\bk\b/.test(lower) || /\bthousand\b/.test(lower)) {
    return Math.round(numeric * 1_000);
  }

  return Math.round(numeric);
};
