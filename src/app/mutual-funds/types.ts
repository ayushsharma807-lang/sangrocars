export type MutualFundSnapshot = {
  schemeCode: string;
  schemeName: string;
  fundHouse: string | null;
  category: string | null;
  latestNav: number | null;
  navDate: string | null;
  lastUpdated: string;
  returns: {
    oneDay: number | null;
    oneMonth: number | null;
    sixMonth: number | null;
    oneYear: number | null;
  };
  sparkline: number[];
};

export type MutualFundHistoryPoint = {
  date: string;
  nav: number;
};

export type MutualFundSearchResult = {
  schemeCode: string;
  schemeName: string;
};
