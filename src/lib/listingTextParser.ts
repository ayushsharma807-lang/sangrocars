const KNOWN_MAKES = [
  "Maruti Suzuki",
  "Hyundai",
  "Tata",
  "Mahindra",
  "Toyota",
  "Kia",
  "Honda",
  "MG",
  "Skoda",
  "Volkswagen",
  "Renault",
  "Nissan",
  "Ford",
  "Jeep",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Lexus",
  "Volvo",
];

const FUEL_TYPES = ["petrol", "diesel", "cng", "electric", "hybrid"];
const TRANSMISSIONS = ["automatic", "manual", "cvt", "amt", "dct"];

export type ParsedListingDraft = {
  type: "used" | "new";
  status: "available" | "sold";
  make: string | null;
  model: string | null;
  variant: string | null;
  year: number | null;
  price: number | null;
  km: number | null;
  fuel: string | null;
  transmission: string | null;
  location: string | null;
  description: string | null;
  photo_urls: string[];
};

const titleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const normalizeText = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim();

const parseNumber = (raw: string) => {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const parseIndianMoney = (value: string) => {
  const lower = value.toLowerCase();
  const num = parseNumber(value);
  if (!num) return null;
  if (lower.includes("cr")) return Math.round(num * 10_000_000);
  if (lower.includes("lakh") || lower.includes("lac") || /\bl\b/.test(lower)) {
    return Math.round(num * 100_000);
  }
  if (lower.includes("k")) return Math.round(num * 1_000);
  return Math.round(num);
};

const detectFuel = (text: string) => {
  const lower = text.toLowerCase();
  const fuel = FUEL_TYPES.find((item) => lower.includes(item));
  return fuel ? titleCase(fuel) : null;
};

const detectTransmission = (text: string) => {
  const lower = text.toLowerCase();
  const transmission = TRANSMISSIONS.find((item) => lower.includes(item));
  return transmission ? titleCase(transmission) : null;
};

const detectYear = (text: string) => {
  const match = text.match(/\b(19\d{2}|20\d{2})\b/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
};

const detectKm = (text: string) => {
  const match = text.match(
    /\b(\d[\d,.\s]{1,12})\s*(km|kms|kilometer|kilometres|kilometers)\b/i
  );
  if (!match) return null;
  const parsed = parseNumber(match[1]);
  return parsed ? Math.round(parsed) : null;
};

const detectPrice = (text: string) => {
  const lineMatch = text.match(
    /\b(price|asking|offer)\s*[:\-]?\s*(rs\.?|inr|₹)?\s*([0-9][0-9.,\s]*(?:\s*(lakh|lac|cr|k))?)/i
  );
  if (lineMatch?.[3]) {
    return parseIndianMoney(lineMatch[3]);
  }

  const currencyMatch = text.match(
    /(rs\.?|inr|₹)\s*([0-9][0-9.,\s]*(?:\s*(lakh|lac|cr|k))?)/i
  );
  if (currencyMatch?.[2]) {
    return parseIndianMoney(currencyMatch[2]);
  }

  return null;
};

const detectLocation = (text: string) => {
  const labeled = text.match(/\b(city|location|loc)\s*[:\-]\s*([a-z ,.-]{2,60})/i);
  if (labeled?.[2]) return titleCase(labeled[2].trim());
  return null;
};

const detectType = (text: string): "used" | "new" => {
  if (/\bnew\b/i.test(text)) return "new";
  return "used";
};

const detectStatus = (text: string): "available" | "sold" => {
  if (/\bsold\b/i.test(text)) return "sold";
  return "available";
};

const detectMakeModelVariant = (text: string) => {
  const cleaned = normalizeText(text);
  const lower = cleaned.toLowerCase();

  const labeledMake = cleaned.match(/\bmake\s*[:\-]\s*([a-z0-9 -]+)/i)?.[1];
  const labeledModel = cleaned.match(/\bmodel\s*[:\-]\s*([a-z0-9 -]+)/i)?.[1];
  const labeledVariant = cleaned.match(/\bvariant\s*[:\-]\s*([a-z0-9 -]+)/i)?.[1];

  if (labeledMake || labeledModel) {
    return {
      make: labeledMake ? titleCase(labeledMake.trim()) : null,
      model: labeledModel ? titleCase(labeledModel.trim()) : null,
      variant: labeledVariant ? titleCase(labeledVariant.trim()) : null,
    };
  }

  const matchedMake = KNOWN_MAKES.find((item) =>
    lower.includes(item.toLowerCase())
  );
  if (!matchedMake) {
    return { make: null, model: null, variant: null };
  }

  const idx = lower.indexOf(matchedMake.toLowerCase());
  const tail = cleaned.slice(idx + matchedMake.length).trim();
  const tailParts = tail
    .replace(/[|,]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !/^(price|km|kms|petrol|diesel|automatic|manual|cng)$/i.test(word))
    .slice(0, 3);

  const model = tailParts[0] ? titleCase(tailParts[0]) : null;
  const variant = tailParts.length > 1 ? titleCase(tailParts.slice(1).join(" ")) : null;

  return {
    make: matchedMake,
    model,
    variant,
  };
};

const dedupeUrls = (urls: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of urls) {
    const normalized = url.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result;
};

export const extractUrlsFromText = (text: string) => {
  const matches = text.match(/https?:\/\/[^\s)]+/gi) ?? [];
  return dedupeUrls(matches);
};

export const parseListingText = (
  rawText: string,
  extraPhotoUrls: string[] = []
): ParsedListingDraft => {
  const text = normalizeText(rawText);
  const makeModel = detectMakeModelVariant(text);
  const parsedUrls = extractUrlsFromText(text);

  return {
    type: detectType(text),
    status: detectStatus(text),
    make: makeModel.make,
    model: makeModel.model,
    variant: makeModel.variant,
    year: detectYear(text),
    price: detectPrice(text),
    km: detectKm(text),
    fuel: detectFuel(text),
    transmission: detectTransmission(text),
    location: detectLocation(text),
    description: text || null,
    photo_urls: dedupeUrls([...extraPhotoUrls, ...parsedUrls]),
  };
};
