export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const dealerSlug = (name: string, id: string) => {
  const base = slugify(name || "dealer");
  return `${base || "dealer"}--${id}`;
};

export const dealerIdFromSlug = (slug: string) => {
  const marker = "--";
  const idx = slug.lastIndexOf(marker);
  if (idx === -1) return null;
  return slug.slice(idx + marker.length).trim() || null;
};
