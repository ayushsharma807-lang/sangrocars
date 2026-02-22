import { getClientIp } from "@/lib/rateLimit";

type CaptchaResult =
  | { ok: true; enabled: boolean }
  | { ok: false; enabled: true; error: string };

const HCAPTCHA_VERIFY_URL = "https://hcaptcha.com/siteverify";

const firstNonEmpty = (...values: Array<string | null | undefined>) => {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
};

export const readCaptchaToken = (
  req: Request,
  formData?: FormData,
  body?: Record<string, unknown> | null
) =>
  firstNonEmpty(
    req.headers.get("x-captcha-token"),
    formData?.get("captcha_token")?.toString(),
    formData?.get("h-captcha-response")?.toString(),
    typeof body?.captcha_token === "string" ? body.captcha_token : "",
    typeof body?.captchaToken === "string" ? body.captchaToken : "",
    typeof body?.["h-captcha-response"] === "string"
      ? body["h-captcha-response"]
      : ""
  );

export const verifyCaptcha = async (
  req: Request,
  token?: string | null
): Promise<CaptchaResult> => {
  const secret = String(process.env.HCAPTCHA_SECRET ?? "").trim();
  if (!secret) {
    return { ok: true, enabled: false };
  }

  const value = String(token ?? "").trim();
  if (!value) {
    return { ok: false, enabled: true, error: "missing_captcha_token" };
  }

  const ip = getClientIp(req);
  const payload = new URLSearchParams({
    secret,
    response: value,
    remoteip: ip,
  });

  const response = await fetch(HCAPTCHA_VERIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: payload.toString(),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);

  if (!response?.ok) {
    return { ok: false, enabled: true, error: "captcha_verification_failed" };
  }

  const data = (await response.json().catch(() => null)) as
    | { success?: boolean }
    | null;
  if (!data?.success) {
    return { ok: false, enabled: true, error: "captcha_invalid" };
  }

  return { ok: true, enabled: true };
};
