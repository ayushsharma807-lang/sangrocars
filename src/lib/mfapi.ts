import "server-only";

import type {
  MutualFundHistoryPoint,
  MutualFundSearchResult,
  MutualFundSnapshot,
} from "@/app/mutual-funds/types";

const MFAPI_BASE = "https://api.mfapi.in/mf";
const NAV_REVALIDATE_SECONDS = 60 * 60 * 12;

type MfApiLatestResponse = {
  meta?: {
    fund_house?: string | null;
    scheme_category?: string | null;
    scheme_code?: number | string;
    scheme_name?: string | null;
  };
  data?: Array<{
    date?: string | null;
    nav?: string | number | null;
  }>;
  status?: string;
};

type MfApiHistoryResponse = {
  meta?: {
    fund_house?: string | null;
    scheme_category?: string | null;
    scheme_code?: number | string;
    scheme_name?: string | null;
  };
  data?: Array<{
    date?: string | null;
    nav?: string | number | null;
  }>;
  status?: string;
};

const parseMfapiDate = (raw?: string | null) => {
  if (!raw) return null;
  const [day, month, year] = raw.split("-");
  if (!day || !month || !year) return null;
  return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00.000Z`);
};

const parseNav = (value?: string | number | null) => {
  const nav = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(nav) ? nav : null;
};

const normalizeHistory = (history: MfApiHistoryResponse["data"]): MutualFundHistoryPoint[] => {
  return (history ?? [])
    .map((entry) => {
      const date = parseMfapiDate(entry.date);
      const nav = parseNav(entry.nav);
      if (!date || nav === null) return null;
      return {
        date: date.toISOString(),
        nav,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a!.date).getTime() - new Date(b!.date).getTime()) as MutualFundHistoryPoint[];
};

const resolveReturn = (history: MutualFundHistoryPoint[], days: number) => {
  if (history.length < 2) return null;
  const latest = history[history.length - 1];
  const targetTime = new Date(latest.date).getTime() - days * 24 * 60 * 60 * 1000;
  let candidate = history[0];

  for (const point of history) {
    if (new Date(point.date).getTime() <= targetTime) {
      candidate = point;
    } else {
      break;
    }
  }

  if (!candidate || candidate.nav <= 0) return null;
  return Number((((latest.nav - candidate.nav) / candidate.nav) * 100).toFixed(2));
};

const buildSparkline = (history: MutualFundHistoryPoint[], limit = 32) => {
  if (history.length <= limit) return history.map((point) => Number(point.nav.toFixed(4)));
  const sampled: number[] = [];
  for (let index = 0; index < limit; index += 1) {
    const sourceIndex = Math.floor((index / (limit - 1)) * (history.length - 1));
    sampled.push(Number(history[sourceIndex]!.nav.toFixed(4)));
  }
  return sampled;
};

async function fetchJson<T>(url: string, revalidate = NAV_REVALIDATE_SECONDS): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate },
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`MFAPI request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function searchMutualFunds(query: string): Promise<MutualFundSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = `${MFAPI_BASE}/search?q=${encodeURIComponent(trimmed)}`;
  const response = await fetchJson<Array<{ schemeCode?: number | string; schemeName?: string }>>(url, 60 * 60);

  return response
    .map((item) => ({
      schemeCode: String(item.schemeCode ?? "").trim(),
      schemeName: String(item.schemeName ?? "").trim(),
    }))
    .filter((item) => item.schemeCode && item.schemeName)
    .slice(0, 12);
}

export async function fetchMutualFundHistory(schemeCode: string): Promise<{
  meta: {
    schemeCode: string;
    schemeName: string;
    fundHouse: string | null;
    category: string | null;
  };
  history: MutualFundHistoryPoint[];
}> {
  const response = await fetchJson<MfApiHistoryResponse>(`${MFAPI_BASE}/${schemeCode}`);
  const history = normalizeHistory(response.data);

  return {
    meta: {
      schemeCode: String(response.meta?.scheme_code ?? schemeCode),
      schemeName: String(response.meta?.scheme_name ?? `Scheme ${schemeCode}`),
      fundHouse: response.meta?.fund_house ?? null,
      category: response.meta?.scheme_category ?? null,
    },
    history,
  };
}

export async function fetchMutualFundSnapshot(schemeCode: string): Promise<MutualFundSnapshot> {
  const [latestResponse, historyResponse] = await Promise.all([
    fetchJson<MfApiLatestResponse>(`${MFAPI_BASE}/${schemeCode}/latest`),
    fetchMutualFundHistory(schemeCode),
  ]);

  const latestEntry = latestResponse.data?.[0];
  const latestNav = parseNav(latestEntry?.nav) ?? historyResponse.history.at(-1)?.nav ?? null;
  const latestDate = parseMfapiDate(latestEntry?.date)?.toISOString() ?? historyResponse.history.at(-1)?.date ?? null;

  return {
    schemeCode: historyResponse.meta.schemeCode,
    schemeName: historyResponse.meta.schemeName,
    fundHouse: latestResponse.meta?.fund_house ?? historyResponse.meta.fundHouse,
    category: latestResponse.meta?.scheme_category ?? historyResponse.meta.category,
    latestNav,
    navDate: latestDate,
    lastUpdated: new Date().toISOString(),
    returns: {
      oneDay: resolveReturn(historyResponse.history, 1),
      oneMonth: resolveReturn(historyResponse.history, 30),
      sixMonth: resolveReturn(historyResponse.history, 180),
      oneYear: resolveReturn(historyResponse.history, 365),
    },
    sparkline: buildSparkline(historyResponse.history),
  };
}
