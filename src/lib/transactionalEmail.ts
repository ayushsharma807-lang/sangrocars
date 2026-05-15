const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "";
const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO ?? "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sangrocars.in";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const sendSellerApprovalPendingEmail = async (payload: {
  to: string | null;
  sellerName?: string | null;
  listingTitle: string;
  location?: string | null;
  priceText?: string | null;
  listingId: string;
}) => {
  if (!payload.to || !RESEND_API_KEY || !RESEND_FROM_EMAIL) return false;

  const sellerName = payload.sellerName?.trim() || "there";
  const listingUrl = `${SITE_URL.replace(/\/$/, "")}/sell?status=submitted&id=${payload.listingId}`;
  const subject = "Sangro: your car is waiting for approval";

  const lines = [
    `Hi ${sellerName},`,
    "",
    "Your car has been submitted on Sangro and is waiting for admin approval.",
    "We will update you soon after review.",
    "",
    `Car: ${payload.listingTitle}`,
    payload.location ? `Location: ${payload.location}` : null,
    payload.priceText ? `Price: ${payload.priceText}` : null,
    `Reference: ${payload.listingId}`,
    "",
    `Status page: ${listingUrl}`,
  ].filter(Boolean);

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <p>Hi ${escapeHtml(sellerName)},</p>
      <p>Your car has been submitted on <strong>Sangro</strong> and is waiting for admin approval.</p>
      <p>We will update you soon after review.</p>
      <div style="padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc">
        <p style="margin:0 0 8px"><strong>Car:</strong> ${escapeHtml(payload.listingTitle)}</p>
        ${payload.location ? `<p style="margin:0 0 8px"><strong>Location:</strong> ${escapeHtml(payload.location)}</p>` : ""}
        ${payload.priceText ? `<p style="margin:0 0 8px"><strong>Price:</strong> ${escapeHtml(payload.priceText)}</p>` : ""}
        <p style="margin:0"><strong>Reference:</strong> ${escapeHtml(payload.listingId)}</p>
      </div>
      <p style="margin-top:16px"><a href="${escapeHtml(listingUrl)}">Open status page</a></p>
    </div>
  `;

  const body: Record<string, unknown> = {
    from: RESEND_FROM_EMAIL,
    to: [payload.to],
    subject,
    text: lines.join("\n"),
    html,
  };

  if (RESEND_REPLY_TO) {
    body.reply_to = RESEND_REPLY_TO;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error("Seller confirmation email failed:", await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Seller confirmation email crashed:", error);
    return false;
  }
};
