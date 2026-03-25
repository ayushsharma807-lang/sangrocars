const parseArrayLiteral = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) return [] as string[];

  const items: string[] = [];
  const pattern = /"([^"]+)"|([^,]+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(inner)) !== null) {
    const raw = (match[1] ?? match[2] ?? "").trim();
    if (raw) items.push(raw);
  }
  return items;
};

const normalizeString = (value: string) =>
  value
    .split(/[\n,|]/)
    .map((item) => item.trim())
    .filter(Boolean);

const joinUrl = (base: string, path: string) =>
  `${base.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;

const toSupabasePhotoUrl = (value: string) => {
  if (/^https?:\/\//i.test(value)) return value;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return value;

  if (value.startsWith("/storage/")) {
    return joinUrl(base, value);
  }

  const bucket =
    process.env.NEXT_PUBLIC_LISTING_PHOTO_BUCKET ??
    process.env.NEXT_PUBLIC_CAR_IMAGE_BUCKET ??
    "car-images";
  const cleaned = value.replace(/^\/+/, "").replace(/^public\//, "");
  return joinUrl(base, `storage/v1/object/public/${bucket}/${cleaned}`);
};

export const normalizePhotoUrls = (
  value?: string[] | string | null
): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => item.trim())
      .filter(Boolean)
      .map(toSupabasePhotoUrl);
  }
  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean)
          .map(toSupabasePhotoUrl);
      }
    } catch {
      const literal = parseArrayLiteral(trimmed);
      if (literal) {
        return literal
          .map((item) => item.trim())
          .filter(Boolean)
          .map(toSupabasePhotoUrl);
      }
    }
  }

  return normalizeString(trimmed).map(toSupabasePhotoUrl);
};

export const getPrimaryPhoto = (value?: string[] | string | null) =>
  normalizePhotoUrls(value)[0] ?? null;
