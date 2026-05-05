type AmfiNavRecord = {
  schemeCode: string;
  fundName: string;
  nav: number;
  navDate: string | null;
};

const AMFI_URL = "https://www.amfiindia.com/spages/NAVAll.txt";

const parseAmfiDate = (raw: string) => {
  const [day, month, year] = raw.split("-");
  if (!day || !month || !year) return null;
  const monthMap: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  const monthNumber = monthMap[month];
  if (!monthNumber) return null;
  return `${year}-${monthNumber}-${day.padStart(2, "0")}`;
};

export const fetchAmfiNavMap = async () => {
  const response = await fetch(AMFI_URL, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    throw new Error("AMFI NAV fetch failed.");
  }

  const text = await response.text();
  const map = new Map<string, AmfiNavRecord>();

  for (const line of text.split("\n")) {
    const parts = line.split(";");
    if (parts.length < 6) continue;

    const schemeCode = parts[0]?.trim();
    const fundName = parts[3]?.trim();
    const nav = Number(parts[4]?.trim());
    const navDate = parseAmfiDate(parts[5]?.trim() ?? "");

    if (!schemeCode || !fundName || !Number.isFinite(nav)) continue;

    map.set(schemeCode, {
      schemeCode,
      fundName,
      nav,
      navDate,
    });
  }

  return map;
};

export const lookupAmfiNavForCodes = async (schemeCodes: string[]) => {
  const uniqueCodes = Array.from(new Set(schemeCodes.filter(Boolean)));
  if (uniqueCodes.length === 0) return new Map<string, AmfiNavRecord>();

  const navMap = await fetchAmfiNavMap();
  const filtered = new Map<string, AmfiNavRecord>();

  for (const code of uniqueCodes) {
    const record = navMap.get(code);
    if (record) {
      filtered.set(code, record);
    }
  }

  return filtered;
};
