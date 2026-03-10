const PENDING_APPROVAL_MARKER = "[[PENDING_APPROVAL]]";
const DEALER_SUBMITTED_PRICE_MARKER = "[[DEALER_SUBMITTED_PRICE:";

const dealerPriceLine = (price?: number | null) =>
  typeof price === "number" && Number.isFinite(price) && price > 0
    ? `${DEALER_SUBMITTED_PRICE_MARKER}${Math.round(price)}]]`
    : null;

export const markListingPendingApproval = (description: string | null | undefined) => {
  const clean = String(description ?? "").trim();
  if (clean.startsWith(PENDING_APPROVAL_MARKER)) return clean;
  return clean ? `${PENDING_APPROVAL_MARKER}\n${clean}` : PENDING_APPROVAL_MARKER;
};

export const withDealerSubmittedPrice = (
  description: string | null | undefined,
  price?: number | null
) => {
  const clean = String(description ?? "")
    .replace(/\[\[DEALER_SUBMITTED_PRICE:\d+\]\]\n?/g, "")
    .trim();
  const marker = dealerPriceLine(price);
  if (!marker) return clean || null;
  return clean ? `${marker}\n${clean}` : marker;
};

export const extractDealerSubmittedPrice = (description?: string | null) => {
  const match = String(description ?? "").match(/\[\[DEALER_SUBMITTED_PRICE:(\d+)\]\]/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
};

export const clearListingPendingApproval = (description: string | null | undefined) => {
  return String(description ?? "")
    .replace(PENDING_APPROVAL_MARKER, "")
    .replace(/^\s+/, "")
    .trim();
};

export const isListingPendingApproval = (listing: {
  status?: string | null;
  description?: string | null;
}) => {
  return (
    listing.status === "pending" ||
    String(listing.description ?? "").includes(PENDING_APPROVAL_MARKER)
  );
};

export const stripListingInternalMeta = (description: string | null | undefined) => {
  return String(description ?? "")
    .replace(PENDING_APPROVAL_MARKER, "")
    .replace(/\[\[DEALER_SUBMITTED_PRICE:\d+\]\]\n?/g, "")
    .trim();
};
