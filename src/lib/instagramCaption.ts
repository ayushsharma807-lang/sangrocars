import { formatKm, formatPriceCompact, titleCase } from "@/lib/listingDisplay";

type CaptionListing = {
  id: string;
  make: string | null;
  model: string | null;
  variant: string | null;
  year: number | null;
  fuel: string | null;
  transmission: string | null;
  km: number | null;
  price: number | null;
};

export const buildInstagramCaption = (
  listing: CaptionListing,
  listingUrl: string
) => {
  const title = [
    listing.year ?? undefined,
    titleCase(listing.make),
    titleCase(listing.model),
    titleCase(listing.variant),
  ]
    .filter(Boolean)
    .join(" ");

  const lines = [
    title || "SangroCars Listing",
    listing.year ? `Year: ${listing.year}` : null,
    listing.km ? `KM: ${formatKm(listing.km)}` : null,
    listing.fuel ? `Fuel: ${titleCase(listing.fuel)}` : null,
    listing.transmission ? `Transmission: ${titleCase(listing.transmission)}` : null,
    listing.price
      ? `Price: ${formatPriceCompact(listing.price)}`
      : "Price: On request",
    "Finance available",
    `View more: ${listingUrl}`,
    "DM now or contact SangroCars",
  ].filter(Boolean);

  return lines.join("\n");
};
