type RateLimitOptions = {
  bucket: string;
  limit: number;
  windowMs: number;
};

type RateEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfter: number;
};

const getStore = () => {
  const globalScope = globalThis as unknown as {
    __carhubRateLimitStore?: Map<string, RateEntry>;
  };
  if (!globalScope.__carhubRateLimitStore) {
    globalScope.__carhubRateLimitStore = new Map<string, RateEntry>();
  }
  return globalScope.__carhubRateLimitStore;
};

export const getClientIp = (req: Request) => {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return "unknown";
};

export const checkRateLimit = (
  req: Request,
  options: RateLimitOptions
): RateLimitResult => {
  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${options.bucket}:${ip}`;
  const store = getStore();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      ok: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfter: Math.ceil(options.windowMs / 1000),
    };
  }

  if (existing.count >= options.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  store.set(key, existing);
  return {
    ok: true,
    remaining: Math.max(0, options.limit - existing.count),
    retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
};
