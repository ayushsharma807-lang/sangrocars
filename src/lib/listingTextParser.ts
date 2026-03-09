const KNOWN_MAKES = [
  "Maruti",
  "Maruti Suzuki",
  "Suzuki",
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
const COLORS = [
  "white",
  "black",
  "silver",
  "grey",
  "gray",
  "red",
  "blue",
  "brown",
  "green",
  "orange",
  "yellow",
  "gold",
  "beige",
  "maroon",
];

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
  color: string | null;
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

const parseKmValue = (value: string) => {
  const lower = value.toLowerCase();
  const num = parseNumber(value);
  if (!num) return null;
  if (/\bk\b/.test(lower)) return Math.round(num * 1_000);
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
  return parseKmValue(match[1]);
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
  const softLabeled = text.match(/\b(city|location|loc)\s+([a-z][a-z ,.-]{1,60})/i);
  if (softLabeled?.[2]) return titleCase(softLabeled[2].trim());
  return null;
};

const detectColor = (text: string) => {
  const lower = text.toLowerCase();
  const color = COLORS.find((item) => lower.includes(item));
  if (!color) return null;
  return color === "gray" ? "Grey" : titleCase(color);
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
    .filter(
      (word) =>
        !/^(price|asking|offer|km|kms|petrol|diesel|automatic|manual|cng|electric|hybrid|city|location|loc)$/i.test(
          word
        )
    )
    .filter((word) => !/^(19\d{2}|20\d{2})$/.test(word))
    .filter((word) => !/^\d[\d,.]*$/.test(word))
    .slice(0, 3);

  const model = tailParts[0] ? titleCase(tailParts[0]) : null;
  const variant = tailParts.length > 1 ? titleCase(tailParts.slice(1).join(" ")) : null;

  return {
    make: matchedMake,
    model,
    variant,
  };
};

const detectLooseLocation = (
  text: string,
  parts: { make: string | null; model: string | null; variant: string | null }
) => {
  const strict = detectLocation(text);
  if (strict) return strict;

  let working = normalizeText(text).toLowerCase();
  const phrases = [
    parts.make,
    parts.model,
    parts.variant,
    detectFuel(text),
    detectTransmission(text),
    detectColor(text),
  ]
    .filter(Boolean)
    .map((item) => String(item).toLowerCase());

  for (const phrase of phrases) {
    working = working.replace(new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), " ");
  }

  working = working
    .replace(/\b(19\d{2}|20\d{2})\b/g, " ")
    .replace(/\b\d[\d,.]*\s*(km|kms|kilometer|kilometres|kilometers)\b/gi, " ")
    .replace(/\b(rs\.?|inr|₹)\s*\d[\d,.\s]*(lakh|lac|cr|k)?\b/gi, " ")
    .replace(/\b\d[\d,.\s]*(lakh|lac|cr|k)\b/gi, " ")
    .replace(/\b(price|asking|offer|owner|driven|sell|selling|car)\b/gi, " ")
    .replace(/[^a-z\s-]/gi, " ");

  const tokens = working
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => item.length > 2 && !COLORS.includes(item));

  if (tokens.length === 0) return null;
  const candidate = tokens.slice(-2).join(" ");
  return titleCase(candidate);
};

const isProbablyNameLine = (value: string) =>
  /[a-z]/i.test(value) && value.replace(/[^a-z]/gi, "").length >= 2;

const parseLineFormat = (rawText: string) => {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 4) return null;
  if (!isProbablyNameLine(lines[0]) || !isProbablyNameLine(lines[1])) return null;

  const make = titleCase(lines[0]);
  const model = titleCase(lines[1]);
  let variant: string | null = null;
  let year: number | null = null;
  let price: number | null = null;
  let km: number | null = null;
  let fuel: string | null = null;
  let transmission: string | null = null;
  let location: string | null = null;

  for (const line of lines.slice(2)) {
    if (!year) {
      const detected = detectYear(line);
      if (detected) {
        year = detected;
        continue;
      }
    }
    if (!price) {
      const detected = parseIndianMoney(line);
      if (detected) {
        price = detected;
        continue;
      }
    }
    if (!km) {
      const detected = detectKm(line);
      if (detected) {
        km = detected;
        continue;
      }
    }
    if (!fuel) {
      const detected = detectFuel(line);
      if (detected) {
        fuel = detected;
        continue;
      }
    }
    if (!transmission) {
      const detected = detectTransmission(line);
      if (detected) {
        transmission = detected;
        continue;
      }
    }
    if (!variant && isProbablyNameLine(line)) {
      variant = titleCase(line);
      continue;
    }
    if (!location && isProbablyNameLine(line)) {
      location = titleCase(line);
    }
  }

  return {
    make,
    model,
    variant,
    year,
    price,
    km,
    fuel,
    transmission,
    location,
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
  const lineParsed = parseLineFormat(rawText);
  const makeModel = detectMakeModelVariant(text);
  const parsedUrls = extractUrlsFromText(text);
  const color = detectColor(text);

  return {
    type: detectType(text),
    status: detectStatus(text),
    make: lineParsed?.make ?? makeModel.make,
    model: lineParsed?.model ?? makeModel.model,
    variant: lineParsed?.variant ?? makeModel.variant,
    year: lineParsed?.year ?? detectYear(text),
    price: lineParsed?.price ?? detectPrice(text),
    km: lineParsed?.km ?? detectKm(text),
    fuel: lineParsed?.fuel ?? detectFuel(text),
    transmission: lineParsed?.transmission ?? detectTransmission(text),
    location: lineParsed?.location ?? detectLooseLocation(text, makeModel),
    color,
    description: text || null,
    photo_urls: dedupeUrls([...extraPhotoUrls, ...parsedUrls]),
  };
};
