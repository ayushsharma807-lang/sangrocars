const DEFAULT_SITE_URL = "https://www.sangrocars.in";

const normalizeSiteUrl = (value?: string | null) => {
  if (!value) return DEFAULT_SITE_URL;
  try {
    return new URL(value).origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
};

export const getPublicApiBase = () =>
  normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const getPublicApiUrl = (path: string) => {
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return `${getPublicApiBase()}${safePath}`;
};

