export const normalizePhoneForAuth = (value?: string | null) => {
  if (!value) return null;
  const raw = value.trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (raw.startsWith("+")) {
    if (digits.length >= 10 && digits.length <= 15) return `+${digits}`;
    return null;
  }

  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;

  return null;
};

export const phoneVariants = (phone?: string | null) => {
  const normalized = normalizePhoneForAuth(phone);
  if (!normalized) return [] as string[];
  const digits = normalized.replace(/\D/g, "");
  const local10 = digits.length >= 10 ? digits.slice(-10) : digits;
  return Array.from(new Set([normalized, digits, local10]));
};
