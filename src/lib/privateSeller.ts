type SellerInput = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
};

export type PrivateSellerInfo = {
  name: string | null;
  phone: string | null;
  email: string | null;
};

const MARKERS = {
  name: "[SELLER_NAME]",
  phone: "[SELLER_PHONE]",
  email: "[SELLER_EMAIL]",
};

const cleanInline = (value?: string | null) =>
  value ? value.replace(/\s+/g, " ").trim() : "";

export const buildPrivateSellerDescription = (
  seller: SellerInput,
  userDescription?: string | null
) => {
  const lines: string[] = [];
  const name = cleanInline(seller.name);
  const phone = cleanInline(seller.phone);
  const email = cleanInline(seller.email);
  const details = userDescription?.trim() ?? "";

  if (name) lines.push(`${MARKERS.name}: ${name}`);
  if (phone) lines.push(`${MARKERS.phone}: ${phone}`);
  if (email) lines.push(`${MARKERS.email}: ${email}`);

  if (lines.length > 0 && details) {
    lines.push("---");
  }
  if (details) {
    lines.push(details);
  }

  return lines.join("\n").trim() || null;
};

export const parsePrivateSellerDescription = (description?: string | null) => {
  if (!description) {
    return {
      seller: { name: null, phone: null, email: null } as PrivateSellerInfo,
      cleanDescription: null as string | null,
    };
  }

  const lines = description
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  let name: string | null = null;
  let phone: string | null = null;
  let email: string | null = null;
  const remaining: string[] = [];

  for (const line of lines) {
    if (line.startsWith(`${MARKERS.name}:`)) {
      name = cleanInline(line.replace(`${MARKERS.name}:`, "")) || null;
      continue;
    }
    if (line.startsWith(`${MARKERS.phone}:`)) {
      phone = cleanInline(line.replace(`${MARKERS.phone}:`, "")) || null;
      continue;
    }
    if (line.startsWith(`${MARKERS.email}:`)) {
      email = cleanInline(line.replace(`${MARKERS.email}:`, "")) || null;
      continue;
    }
    if (line === "---") {
      continue;
    }
    remaining.push(line);
  }

  return {
    seller: { name, phone, email } as PrivateSellerInfo,
    cleanDescription: remaining.join("\n").trim() || null,
  };
};
