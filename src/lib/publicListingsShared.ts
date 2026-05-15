export type PublicListing = {
  id: string;
  dealer_id: string | null;
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
  photo_urls: string[] | null;
  stock_id: string | null;
  created_at: string | null;
  dealer_code?: string | null;
  dealer_count?: number | null;
};

export const PAGE_SIZE = 9;
