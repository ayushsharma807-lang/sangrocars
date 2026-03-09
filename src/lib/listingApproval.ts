const PENDING_APPROVAL_MARKER = "[[PENDING_APPROVAL]]";

export const markListingPendingApproval = (description: string | null | undefined) => {
  const clean = String(description ?? "").trim();
  if (clean.startsWith(PENDING_APPROVAL_MARKER)) return clean;
  return clean ? `${PENDING_APPROVAL_MARKER}\n${clean}` : PENDING_APPROVAL_MARKER;
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
