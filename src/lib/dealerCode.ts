const DEALER_CODE_MARKER = "[[DEALER_CODE:";
const NEW_CODE_REGEX = /^[A-Z]{3}\d{3}$/;
const LEGACY_CODE_REGEX = /^\d{6}$/;

const normalizeRawCode = (value?: string | null) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();

export const extractDealerCode = (description?: string | null) => {
  const match = String(description ?? "").match(
    /\[\[DEALER_CODE:([A-Z]{3}\d{3}|\d{6})\]\]/
  );
  if (!match) return null;
  return match[1] ?? null;
};

export const stripDealerCodeMeta = (description?: string | null) =>
  String(description ?? "")
    .replace(/\[\[DEALER_CODE:([A-Z]{3}\d{3}|\d{6})\]\]\n?/g, "")
    .trim();

export const buildDealerCodePrefix = (name?: string | null) => {
  const letters = String(name ?? "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (letters.length >= 3) return letters.slice(0, 3);
  return `${letters}XXX`.slice(0, 3);
};

export const generateDealerCode = (name: string, usedCodes: Set<string>) => {
  const prefix = buildDealerCodePrefix(name);
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const suffix = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    const candidate = `${prefix}${suffix}`;
    if (!usedCodes.has(candidate)) return candidate;
  }
  return null;
};

export const withDealerCode = (
  description: string | null | undefined,
  code?: string | null
) => {
  const clean = String(description ?? "")
    .replace(/\[\[DEALER_CODE:([A-Z]{3}\d{3}|\d{6})\]\]\n?/g, "")
    .trim();

  if (!code) return clean || null;
  const normalized = normalizeRawCode(code);
  if (!NEW_CODE_REGEX.test(normalized) && !LEGACY_CODE_REGEX.test(normalized)) {
    return clean || null;
  }
  const marker = `${DEALER_CODE_MARKER}${normalized}]]`;
  return clean ? `${marker}\n${clean}` : marker;
};

export const isValidDealerCode = (value?: string | null) =>
  NEW_CODE_REGEX.test(normalizeRawCode(value));
