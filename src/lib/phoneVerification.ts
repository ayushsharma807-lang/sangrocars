import crypto from "crypto";
import { normalizePhoneForAuth } from "@/lib/phone";

const COOKIE_NAME = "sg-phone-verified";
const MAX_AGE_SECONDS = 60 * 30;

const getSecret = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXTAUTH_SECRET ||
  process.env.JWT_SECRET ||
  null;

const signValue = (value: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(value).digest("hex");

const parseCookieHeader = (header: string | null) => {
  if (!header) return {} as Record<string, string>;
  return header.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {} as Record<string, string>);
};

export const buildPhoneVerificationCookie = (phoneRaw: string) => {
  const secret = getSecret();
  const normalized = normalizePhoneForAuth(phoneRaw);
  if (!secret || !normalized) return null;
  const timestamp = Date.now();
  const payload = `${normalized}.${timestamp}`;
  const signature = signValue(payload, secret);
  return {
    name: COOKIE_NAME,
    value: `${payload}.${signature}`,
    maxAge: MAX_AGE_SECONDS,
  };
};

export const verifyPhoneCookie = (req: Request, phoneRaw: string) => {
  const secret = getSecret();
  const normalized = normalizePhoneForAuth(phoneRaw);
  if (!secret || !normalized) return false;
  const cookies = parseCookieHeader(req.headers.get("cookie"));
  const value = cookies[COOKIE_NAME];
  if (!value) return false;
  const [cookiePhone, tsRaw, signature] = value.split(".");
  if (!cookiePhone || !tsRaw || !signature) return false;
  if (cookiePhone !== normalized) return false;
  const timestamp = Number(tsRaw);
  if (!Number.isFinite(timestamp)) return false;
  if (Date.now() - timestamp > MAX_AGE_SECONDS * 1000) return false;
  const expected = signValue(`${cookiePhone}.${timestamp}`, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
};
