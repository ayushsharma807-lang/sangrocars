const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_ADMIN_CHAT_ID =
  process.env.TELEGRAM_ADMIN_CHAT_ID ??
  process.env.TELEGRAM_BROADCAST_CHAT_ID ??
  process.env.TELEGRAM_ALLOWED_CHAT_ID ??
  "";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sangrocars.in";

const sendTelegramMessage = async (text: string) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_ADMIN_CHAT_ID,
        text,
      }),
    });
  } catch {
    // ignore notification errors
  }
};

export const notifyPendingListing = async (payload: {
  id: string;
  title: string;
  source: string;
}) => {
  const url = `${SITE_URL}/listing/${payload.id}`;
  const message = `🟡 Pending listing\n${payload.title}\nSource: ${payload.source}\n${url}`;
  await sendTelegramMessage(message);
};

export const notifyPendingBatch = async (payload: {
  count: number;
  source: string;
}) => {
  if (!payload.count) return;
  const message = `🟡 ${payload.count} pending listings added\nSource: ${payload.source}`;
  await sendTelegramMessage(message);
};
