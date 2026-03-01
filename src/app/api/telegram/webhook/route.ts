import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { buildPrivateSellerDescription } from "@/lib/privateSeller";

const LISTING_PHOTO_BUCKET = process.env.LISTING_PHOTO_BUCKET ?? "listing-photos";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_BROADCAST_CHAT_ID =
  process.env.TELEGRAM_BROADCAST_CHAT_ID ??
  process.env.TELEGRAM_ALLOWED_CHAT_ID ??
  "";
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sangrocars.in";

const getLargestPhotoId = (photos: Array<{ file_id: string }> = []) =>
  photos.length ? photos[photos.length - 1]?.file_id : null;

const sanitizeExt = (value?: string | null) => {
  if (!value) return "jpg";
  const cleaned = value.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return cleaned || "jpg";
};

const parseNumber = (raw: string) => {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const parseIndianMoney = (value: string) => {
  const lower = value.toLowerCase();
  const num = parseNumber(value);
  if (!num) return null;
  if (lower.includes("cr")) return Math.round(num * 10_000_000);
  if (lower.includes("lakh") || lower.includes("lac") || /\bl\b/.test(lower)) {
    return Math.round(num * 100_000);
  }
  if (lower.includes("k")) return Math.round(num * 1_000);
  return Math.round(num);
};

const normalizeTransmission = (value: string) => {
  const lower = value.toLowerCase();
  if (lower.includes("automatic") || lower.includes("auto")) return "Automatic";
  if (lower.includes("manual")) return "Manual";
  if (lower.includes("amt")) return "AMT";
  if (lower.includes("cvt")) return "CVT";
  if (lower.includes("dct")) return "DCT";
  return null;
};

const normalizeFuel = (value: string) => {
  const lower = value.toLowerCase();
  if (lower.includes("petrol")) return "Petrol";
  if (lower.includes("diesel")) return "Diesel";
  if (lower.includes("cng")) return "CNG";
  if (lower.includes("electric") || lower.includes("ev")) return "Electric";
  if (lower.includes("hybrid")) return "Hybrid";
  return null;
};

const normalizeCondition = (value: string) => {
  const lower = value.toLowerCase();
  if (lower.includes("excellent")) return "Excellent";
  if (lower.includes("good")) return "Good";
  if (lower.includes("fair")) return "Fair";
  return null;
};

const titleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

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

const sendTelegramMessage = async (chatId: number | string, text: string) => {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log("Telegram bot token missing. Cannot send reply.");
    return;
  }
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }
    );
    if (!response.ok) {
      const detail = await response.text();
      console.log("Telegram sendMessage failed:", response.status, detail);
    }
  } catch (error) {
    console.log("Telegram sendMessage error:", error);
  }
};

const broadcast = async (text: string) => {
  if (!TELEGRAM_BROADCAST_CHAT_ID) return;
  await sendTelegramMessage(TELEGRAM_BROADCAST_CHAT_ID, text);
};

const nextPrompt = (step: string) => {
  switch (step) {
    case "make":
      return "Car make? (Example: Hyundai)";
    case "model":
      return "Car model? (Example: Creta)";
    case "variant":
      return "Variant/trim? (Example: SX)";
    case "year":
      return "Year? (Example: 2021)";
    case "price":
      return "Price? (Example: 12.5 lakh)";
    case "km":
      return "KM driven? (Example: 32000)";
    case "transmission":
      return "Transmission? (Manual / Automatic / AMT / CVT / DCT)";
    case "fuel":
      return "Fuel type? (Petrol / Diesel / CNG / Electric / Hybrid)";
    case "location":
      return "City/Location? (Example: Jalandhar)";
    case "phone":
      return "Seller phone number? (10 digits)";
    case "condition":
      return "Condition? (Excellent / Good)";
    case "photos":
      return "Send 1 to 8 photos now. When done, type /done.";
    default:
      return "Send /post to start.";
  }
};

export async function POST(req: Request) {
  if (TELEGRAM_WEBHOOK_SECRET) {
    const secret = req.headers.get("x-telegram-bot-api-secret-token");
    if (secret !== TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: true });
    }
  }

  const body = await req.json();
  const message = body?.message;
  if (!message) return NextResponse.json({ ok: true });

  const chat = message.chat;
  if (chat?.type !== "private") {
    console.log("Telegram ignored non-private chat:", chat?.type, chat?.id);
    return NextResponse.json({ ok: true });
  }

  const chatId = chat.id as number;
  const user = message.from;
  const userId = user?.id as number | undefined;
  const username = user?.username ?? null;
  const displayName =
    username
      ? `@${username}`
      : [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        `User ${userId}`;
  if (!userId) return NextResponse.json({ ok: true });

  const text = message.text || message.caption || "";
  const trimmedText = String(text || "").trim();
  const command = trimmedText.toLowerCase();

  const photos = message.photo || [];
  const doc = message.document;
  const photoIds = new Set<string>();
  const largestPhotoId = getLargestPhotoId(photos);
  if (largestPhotoId) photoIds.add(largestPhotoId);
  if (doc?.file_id && doc?.mime_type?.startsWith("image/")) {
    photoIds.add(doc.file_id);
  }

  const sb = supabaseServer();
  const { data: session } = await sb
    .from("telegram_sessions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (command === "/cancel") {
    await sb.from("telegram_sessions").delete().eq("user_id", userId);
    await sendTelegramMessage(chatId, "Cancelled. Send /post to start again.");
    await broadcast(`${displayName} cancelled a listing flow.`);
    return NextResponse.json({ ok: true });
  }

  if (command === "/post" || command === "hi" || command === "hello") {
    const payload = {
      user_id: userId,
      chat_id: chatId,
      username,
      step: "make",
      data: {},
      photo_file_ids: [] as string[],
    };
    await sb
      .from("telegram_sessions")
      .upsert(payload, { onConflict: "user_id" });
    await sendTelegramMessage(chatId, nextPrompt("make"));
    await broadcast(`${displayName} started a new listing.`);
    return NextResponse.json({ ok: true });
  }

  if (!session) {
    await sendTelegramMessage(chatId, "Send /post to start listing a car.");
    return NextResponse.json({ ok: true });
  }

  const data = (session.data ?? {}) as Record<string, unknown>;
  const existingPhotos = Array.isArray(session.photo_file_ids)
    ? [...session.photo_file_ids]
    : [];

  const updateSession = async (nextStep: string, nextData: Record<string, unknown>) => {
    await sb
      .from("telegram_sessions")
      .update({
        step: nextStep,
        data: nextData,
      })
      .eq("user_id", userId);
  };

  const updatePhotos = async (photoFileIds: string[]) => {
    await sb
      .from("telegram_sessions")
      .update({
        step: "photos",
        photo_file_ids: photoFileIds,
      })
      .eq("user_id", userId);
  };

  const finalizeListing = async (photoFileIds: string[]) => {
    if (photoFileIds.length < 1) {
      await sendTelegramMessage(chatId, "Please send at least 1 photo.");
      return;
    }

    const folder = `telegram/${String(data.make ?? "car")}-${String(
      data.model ?? "listing"
    )}`
      .toLowerCase()
      .replace(/\s+/g, "-");

    const photoUrls = TELEGRAM_BOT_TOKEN
      ? await uploadTelegramPhotos(photoFileIds.slice(0, 8), folder)
      : [];

    const details = [
      data.condition ? `Condition: ${data.condition}` : null,
      data.location ? `Location: ${data.location}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const description = buildPrivateSellerDescription(
      {
        name: username ? `@${username}` : `Telegram ${userId}`,
        phone: typeof data.phone === "string" ? data.phone : null,
      },
      details
    );

    const payload = {
      source: "telegram",
      dealer_id: null,
      type: "used",
      status: "available",
      make: data.make ?? null,
      model: data.model ?? null,
      variant: data.variant ?? null,
      year: data.year ?? null,
      price: data.price ?? null,
      km: data.km ?? null,
      fuel: data.fuel ?? null,
      transmission: data.transmission ?? null,
      location: data.location ?? null,
      description,
      photo_urls: photoUrls,
    };

    const { data: created, error } = await sb
      .from("listings")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      await sendTelegramMessage(chatId, "Failed to post listing. Try again.");
      await broadcast(`${displayName} listing failed: ${error.message}`);
      return;
    }

    await sb.from("telegram_sessions").delete().eq("user_id", userId);
    const listingUrl = `${SITE_URL}/listing/${created.id}`;
    await sendTelegramMessage(chatId, `Listing posted ✅\n${listingUrl}`);
    await broadcast(
      `New listing by ${displayName}: ${data.make} ${data.model} (${data.year}) - ${data.price}\n${listingUrl}`
    );
  };

  if (session.step === "photos") {
    if (command === "/done") {
      await finalizeListing(existingPhotos);
      return NextResponse.json({ ok: true });
    }

    if (photoIds.size > 0) {
      const nextPhotos = [...existingPhotos, ...photoIds].slice(0, 8);
      await updatePhotos(nextPhotos);
      if (nextPhotos.length >= 8) {
        await finalizeListing(nextPhotos);
        return NextResponse.json({ ok: true });
      }
      await sendTelegramMessage(chatId, `Photo received (${nextPhotos.length}/8). Send more or type /done.`);
      return NextResponse.json({ ok: true });
    }

    await sendTelegramMessage(chatId, "Send photos (1-8) or type /done.");
    return NextResponse.json({ ok: true });
  }

  if (!trimmedText) {
    await sendTelegramMessage(chatId, "Please reply with text.");
    return NextResponse.json({ ok: true });
  }

  switch (session.step) {
    case "make": {
      const nextData = { ...data, make: titleCase(trimmedText) };
      await updateSession("model", nextData);
      await sendTelegramMessage(chatId, nextPrompt("model"));
      await broadcast(`${displayName} make: ${nextData.make}`);
      break;
    }
    case "model": {
      const nextData = { ...data, model: titleCase(trimmedText) };
      await updateSession("variant", nextData);
      await sendTelegramMessage(chatId, nextPrompt("variant"));
      await broadcast(`${displayName} model: ${nextData.model}`);
      break;
    }
    case "variant": {
      const nextData = { ...data, variant: titleCase(trimmedText) };
      await updateSession("year", nextData);
      await sendTelegramMessage(chatId, nextPrompt("year"));
      await broadcast(`${displayName} variant: ${nextData.variant}`);
      break;
    }
    case "year": {
      const year = Number(trimmedText.replace(/[^0-9]/g, ""));
      if (!year || year < 1990 || year > 2100) {
        await sendTelegramMessage(chatId, "Please send a valid year (e.g., 2021).");
        return NextResponse.json({ ok: true });
      }
      const nextData = { ...data, year };
      await updateSession("price", nextData);
      await sendTelegramMessage(chatId, nextPrompt("price"));
      await broadcast(`${displayName} year: ${year}`);
      break;
    }
    case "price": {
      const price = parseIndianMoney(trimmedText);
      if (!price) {
        await sendTelegramMessage(chatId, "Please send a valid price (e.g., 12.5 lakh).");
        return NextResponse.json({ ok: true });
      }
      const nextData = { ...data, price };
      await updateSession("km", nextData);
      await sendTelegramMessage(chatId, nextPrompt("km"));
      await broadcast(`${displayName} price: ${price}`);
      break;
    }
    case "km": {
      const km = parseNumber(trimmedText);
      if (!km) {
        await sendTelegramMessage(chatId, "Please send KM driven (e.g., 32000).");
        return NextResponse.json({ ok: true });
      }
      const nextData = { ...data, km: Math.round(km) };
      await updateSession("transmission", nextData);
      await sendTelegramMessage(chatId, nextPrompt("transmission"));
      await broadcast(`${displayName} km: ${km}`);
      break;
    }
    case "transmission": {
      const transmission = normalizeTransmission(trimmedText);
      if (!transmission) {
        await sendTelegramMessage(chatId, nextPrompt("transmission"));
        return NextResponse.json({ ok: true });
      }
      const nextData = { ...data, transmission };
      await updateSession("fuel", nextData);
      await sendTelegramMessage(chatId, nextPrompt("fuel"));
      await broadcast(`${displayName} transmission: ${transmission}`);
      break;
    }
    case "fuel": {
      const fuel = normalizeFuel(trimmedText);
      if (!fuel) {
        await sendTelegramMessage(chatId, nextPrompt("fuel"));
        return NextResponse.json({ ok: true });
      }
      const nextData = { ...data, fuel };
      await updateSession("location", nextData);
      await sendTelegramMessage(chatId, nextPrompt("location"));
      await broadcast(`${displayName} fuel: ${fuel}`);
      break;
    }
    case "location": {
      const nextData = { ...data, location: titleCase(trimmedText) };
      await updateSession("phone", nextData);
      await sendTelegramMessage(chatId, nextPrompt("phone"));
      await broadcast(`${displayName} location: ${nextData.location}`);
      break;
    }
    case "phone": {
      const digits = trimmedText.replace(/\D/g, "");
      if (digits.length < 10) {
        await sendTelegramMessage(chatId, "Please send a valid phone number.");
        return NextResponse.json({ ok: true });
      }
      const nextData = { ...data, phone: digits };
      await updateSession("condition", nextData);
      await sendTelegramMessage(chatId, nextPrompt("condition"));
      await broadcast(`${displayName} phone added`);
      break;
    }
    case "condition": {
      const condition = normalizeCondition(trimmedText);
      if (!condition) {
        await sendTelegramMessage(chatId, nextPrompt("condition"));
        return NextResponse.json({ ok: true });
      }
      const nextData = { ...data, condition };
      await updateSession("photos", nextData);
      await sendTelegramMessage(chatId, nextPrompt("photos"));
      await broadcast(`${displayName} condition: ${condition}`);
      break;
    }
    default: {
      await sendTelegramMessage(chatId, "Send /post to start listing a car.");
    }
  }

  return NextResponse.json({ ok: true });
}
