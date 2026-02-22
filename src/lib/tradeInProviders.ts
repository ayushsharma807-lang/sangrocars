type Condition = "excellent" | "good" | "fair";

export type TradeInInput = {
  vin?: string;
  make?: string;
  model?: string;
  year: number;
  km: number;
  condition: Condition;
  currentPrice?: number | null;
  postalCode?: string;
};

export type TradeInResult = {
  low: number;
  high: number;
  expected: number;
  confidence: "low" | "medium" | "high";
  notes: string[];
  provider: "blackbook" | "marketcheck" | "internal";
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const median = (values: number[]) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2;
  return sorted[mid];
};

const conditionFactor = (value: string) => {
  if (value === "excellent") return 1.06;
  if (value === "fair") return 0.9;
  return 1;
};

const normalizeVin = (value?: string) =>
  String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();

const maybeConvertUsdToInr = (value: number) => {
  const useInr = (process.env.TRADE_IN_TARGET_CURRENCY ?? "INR").toUpperCase() === "INR";
  if (!useInr) return value;
  const rate = toNumber(process.env.USD_TO_INR_RATE) ?? 83;
  return value * rate;
};

const firstFinite = (...values: unknown[]) => {
  for (const value of values) {
    const num = toNumber(value);
    if (num !== null) return num;
  }
  return null;
};

const pickNumericFromUnknown = (value: unknown): number[] => {
  if (value === null || value === undefined) return [];
  if (typeof value === "number" && Number.isFinite(value)) return [value];
  if (typeof value === "string") {
    const stripped = value.replace(/[^0-9.]/g, "");
    const num = toNumber(stripped);
    return num !== null ? [num] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => pickNumericFromUnknown(item));
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap((item) =>
      pickNumericFromUnknown(item)
    );
  }
  return [];
};

const toOutput = (
  expected: number,
  lowFactor: number,
  highFactor: number,
  provider: TradeInResult["provider"],
  confidence: TradeInResult["confidence"],
  notes: string[]
): TradeInResult => {
  const cleanExpected = clamp(Math.round(expected), 80_000, 12_000_000);
  return {
    low: Math.round(cleanExpected * lowFactor),
    high: Math.round(cleanExpected * highFactor),
    expected: cleanExpected,
    confidence,
    notes,
    provider,
  };
};

const fromMarketCheck = async (input: TradeInInput): Promise<TradeInResult | null> => {
  const apiKey = process.env.MARKETCHECK_API_KEY;
  if (!apiKey) return null;

  const vin = normalizeVin(input.vin);
  if (vin.length !== 17) return null;

  const base = (process.env.MARKETCHECK_BASE_URL ?? "https://api.marketcheck.com").replace(
    /\/$/,
    ""
  );
  const path =
    process.env.MARKETCHECK_PRICE_PATH ?? "/v2/predict/car/us/marketcheck_price";
  const dealerType = process.env.MARKETCHECK_DEALER_TYPE ?? "independent";
  const zip = (input.postalCode ?? process.env.MARKETCHECK_ZIP ?? "").trim();
  if (!zip) return null;

  const miles = Math.max(0, Math.round(input.km * 0.621371));
  const params = new URLSearchParams({
    api_key: apiKey,
    vin,
    miles: String(miles),
    dealer_type: dealerType,
    zip,
  });

  if ((process.env.MARKETCHECK_IS_CERTIFIED ?? "").toLowerCase() === "true") {
    params.set("is_certified", "true");
  }

  const endpoint = `${base}${path}?${params.toString()}`;
  const response = await fetch(endpoint, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as Record<string, unknown>;
  const usdExpected = firstFinite(payload.marketcheck_price, payload.market_check_price);
  if (!usdExpected || usdExpected <= 0) return null;

  const inrExpected = maybeConvertUsdToInr(usdExpected);
  const msrp = firstFinite(payload.msrp);
  const notes = [
    "Live provider: MarketCheck Price API.",
    "MarketCheck valuations are returned in USD and converted to INR with USD_TO_INR_RATE.",
  ];
  if (msrp) {
    notes.push(
      `Provider MSRP reference: ₹${Math.round(
        maybeConvertUsdToInr(msrp)
      ).toLocaleString("en-IN")}.`
    );
  }

  return toOutput(inrExpected, 0.94, 1.06, "marketcheck", "high", notes);
};

const fromBlackBook = async (input: TradeInInput): Promise<TradeInResult | null> => {
  const url = (process.env.BLACKBOOK_VALUATION_URL ?? "").trim();
  const apiKey = (process.env.BLACKBOOK_API_KEY ?? "").trim();
  if (!url || !apiKey) return null;

  const method = (process.env.BLACKBOOK_METHOD ?? "POST").toUpperCase();
  const authHeader = (process.env.BLACKBOOK_AUTH_HEADER ?? "x-api-key").trim();
  const vin = normalizeVin(input.vin);
  const payload = {
    vin: vin || undefined,
    make: input.make,
    model: input.model,
    year: input.year,
    mileage: Math.max(0, Math.round(input.km * 0.621371)),
    condition: input.condition,
    zip: input.postalCode,
  };

  const endpoint =
    method === "GET"
      ? `${url}${url.includes("?") ? "&" : "?"}${new URLSearchParams(
          Object.entries(payload)
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, String(value)])
        ).toString()}`
      : url;

  const response = await fetch(endpoint, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      [authHeader]: apiKey,
    },
    body: method === "GET" ? undefined : JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as Record<string, unknown>;
  const direct = firstFinite(
    data.tradeIn,
    data.trade_in,
    data.tradein,
    data.tradeInValue,
    data.trade_in_value,
    data.valuation
  );
  const fallbackPool = pickNumericFromUnknown(data).filter(
    (value) => value >= 10_000 && value <= 500_000
  );
  const fallbackUsd = median(fallbackPool);
  const usdExpected = direct ?? fallbackUsd;
  if (!usdExpected || usdExpected <= 0) return null;

  const inrExpected = maybeConvertUsdToInr(usdExpected);
  return toOutput(
    inrExpected,
    0.93,
    1.07,
    "blackbook",
    "high",
    [
      "Live provider: Black Book API.",
      "Black Book responses are normalized into a trade-in estimate and converted to INR.",
    ]
  );
};

type InternalInput = TradeInInput & {
  marketPrices: number[];
};

const fromInternalModel = (input: InternalInput): TradeInResult => {
  const marketMedian = median(input.marketPrices);
  const basePrice = marketMedian ?? input.currentPrice ?? 800_000;
  const age = clamp(new Date().getFullYear() - input.year, 0, 20);
  const ageFactor = Math.pow(0.89, age);
  const kmPenalty = 1 - clamp(input.km / 240_000, 0, 0.28);
  const roughValue =
    basePrice * ageFactor * kmPenalty * conditionFactor(input.condition);

  const confidence: TradeInResult["confidence"] =
    input.marketPrices.length >= 25
      ? "high"
      : input.marketPrices.length >= 8
        ? "medium"
        : "low";

  const notes = [
    marketMedian
      ? `Compared against ${input.marketPrices.length} live listings in your market.`
      : "Using fallback valuation model because direct provider data is unavailable.",
    "Mileage and condition are included in the estimate.",
    "Final offer is confirmed after physical inspection and documents.",
  ];

  return toOutput(roughValue, 0.93, 1.07, "internal", confidence, notes);
};

export const buildTradeInValuation = async (
  input: TradeInInput & { marketPrices: number[] }
): Promise<TradeInResult> => {
  const provider = (process.env.TRADE_IN_PROVIDER ?? "auto").toLowerCase();

  if (provider === "marketcheck") {
    const marketCheck = await fromMarketCheck(input);
    if (marketCheck) return marketCheck;
    return fromInternalModel(input);
  }

  if (provider === "blackbook") {
    const blackBook = await fromBlackBook(input);
    if (blackBook) return blackBook;
    return fromInternalModel(input);
  }

  if (provider === "internal") {
    return fromInternalModel(input);
  }

  const blackBook = await fromBlackBook(input);
  if (blackBook) return blackBook;
  const marketCheck = await fromMarketCheck(input);
  if (marketCheck) return marketCheck;
  return fromInternalModel(input);
};
