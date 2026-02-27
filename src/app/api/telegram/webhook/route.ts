import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { parseListingText } from "@/lib/listingTextParser";

const LISTING_PHOTO_BUCKET = process.env.LISTING_PHOTO_BUCKET ?? "listing-photos";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_ALLOWED_CHAT_ID = process.env.TELEGRAM_ALLOWED_CHAT_ID ?? "-5173935159";
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

const getLargestPhotoId = (photos: Array<{ file_id: string }> = []) =>
  photos.length ? photos[photos.length - 1]?.file_id : null;

const sanitizeExt = (value?: string | null) => {
  if (!value) return "jpg";
  const cleaned = value.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return cleaned || "jpg";
};

const getTelegramFileUrl = async (fileId: string) => {
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
  );
  const data = (await response.json()) as {
    ok: boolean;
    result?: { file_path?: string };
    description?: string;
  };
  if (!data.ok || !data.result?.file_path) {
    throw new Error(data.description || "Unable to resolve Telegram file path.");
  }
  return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${data.result.file_path}`;
};

const downloadTelegramPhoto = async (fileId: string) => {
  const url = await getTelegramFileUrl(fileId);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download Telegram file (${response.status}).`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const ext = sanitizeExt(contentType.split("/")[1]);
  return { buffer, contentType, ext };
};

const uploadTelegramPhotos = async (fileIds: string[], folder: string) => {
  const sb = supabaseServer();
  const urls: string[] = [];

  for (let index = 0; index < fileIds.length; index += 1) {
    const fileId = fileIds[index];
    if (!fileId) continue;
    const { buffer, contentType, ext } = await downloadTelegramPhoto(fileId);
    const path = `${folder}/${Date.now()}-${index}.${ext}`;
    const { error } = await sb.storage
      .from(LISTING_PHOTO_BUCKET)
      .upload(path, buffer, {
        upsert: true,
        contentType,
      });
    if (error) continue;
    const { data } = sb.storage.from(LISTING_PHOTO_BUCKET).getPublicUrl(path);
    if (data?.publicUrl) urls.push(data.publicUrl);
  }

  return urls;
};

export async function POST(req: Request) {
  if (TELEGRAM_WEBHOOK_SECRET) {
    const secret = req.headers.get("x-telegram-bot-api-secret-token");
    if (secret !== TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: true });
    }
  }

  const body = await req.json();
  const message = body?.message || body?.channel_post;
  if (!message) {
    return NextResponse.json({ ok: true });
  }

  const chatId = message?.chat?.id;
  if (String(chatId) !== String(TELEGRAM_ALLOWED_CHAT_ID)) {
    return NextResponse.json({ ok: true });
  }

  const text = message.text || message.caption || "";
  const photos = message.photo || [];
  const doc = message.document;

  const photoIds = new Set<string>();
  const largestPhotoId = getLargestPhotoId(photos);
  if (largestPhotoId) photoIds.add(largestPhotoId);
  if (doc?.file_id && doc?.mime_type?.startsWith("image/")) {
    photoIds.add(doc.file_id);
  }

  const parsed = parseListingText(text, []);
  if (!parsed.make || !parsed.model) {
    console.log("Telegram listing skipped: missing make/model");
    return NextResponse.json({ ok: true });
  }

  const photoUrls = TELEGRAM_BOT_TOKEN
    ? await uploadTelegramPhotos(
        Array.from(photoIds),
        `telegram/${parsed.make}-${parsed.model}`.toLowerCase().replace(/\s+/g, "-")
      )
    : [];

  const payload = {
    source: "telegram",
    dealer_id: null,
    type: parsed.type,
    status: parsed.status,
    make: parsed.make,
    model: parsed.model,
    variant: parsed.variant || null,
    year: parsed.year,
    price: parsed.price,
    km: parsed.km,
    fuel: parsed.fuel || null,
    transmission: parsed.transmission || null,
    location: parsed.location || null,
    description: parsed.description || text || null,
    photo_urls: photoUrls,
  };

  const sb = supabaseServer();
  const { error } = await sb.from("listings").insert(payload);
  if (error) {
    console.log("Telegram listing insert failed:", error.message);
  }

  return NextResponse.json({ ok: true });
}
