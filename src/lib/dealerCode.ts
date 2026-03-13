const DEALER_CODE_MARKER = "[[DEALER_CODE:";

export const extractDealerCode = (description?: string | null) => {
  const match = String(description ?? "").match(/\[\[DEALER_CODE:(\d{6})\]\]/);
  if (!match) return null;
  return match[1] ?? null;
};

export const withDealerCode = (
  description: string | null | undefined,
  code?: string | null
) => {
  const clean = String(description ?? "")
    .replace(/\[\[DEALER_CODE:\d{6}\]\]\n?/g, "")
    .trim();

  if (!code) return clean || null;
  const normalized = code.replace(/\D/g, "").slice(0, 6);
  if (normalized.length !== 6) return clean || null;
  const marker = `${DEALER_CODE_MARKER}${normalized}]]`;
  return clean ? `${marker}\n${clean}` : marker;
};

export const isValidDealerCode = (value?: string | null) =>
  /^\d{6}$/.test(String(value ?? "").trim());
