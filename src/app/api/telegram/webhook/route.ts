import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { ensureListingPhotoBucket, LISTING_PHOTO_BUCKET } from "@/lib/listingPhotoBucket";
import { buildPrivateSellerDescription } from "@/lib/privateSeller";
import { notifyPendingListing } from "@/lib/adminNotifications";
import { markListingPendingApproval } from "@/lib/listingApproval";
import { parseListingText } from "@/lib/listingTextParser";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const TELEGRAM_BROADCAST_CHAT_ID =
  process.env.TELEGRAM_BROADCAST_CHAT_ID ??
  process.env.TELEGRAM_ALLOWED_CHAT_ID ??
  "";
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.sangrocars.in";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const OPENAI_PARSER_MODEL = process.env.OPENAI_PARSER_MODEL ?? "gpt-4o-mini";

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
  await ensureListingPhotoBucket(sb);
  const urls: string[] = [];
  const errors: string[] = [];

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
    if (error) {
      errors.push(error.message);
      continue;
    }
    const { data } = sb.storage.from(LISTING_PHOTO_BUCKET).getPublicUrl(path);
    if (data?.publicUrl) urls.push(data.publicUrl);
  }

  return { urls, errors };
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

const sendTelegramMessageWithButtons = async (
  chatId: number | string,
  text: string,
  buttons: Array<Array<{ text: string; callback_data: string }>>
) => {
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
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_markup: {
            inline_keyboard: buttons,
          },
        }),
      }
    );
    if (!response.ok) {
      const detail = await response.text();
      console.log("Telegram sendMessage with buttons failed:", response.status, detail);
    }
  } catch (error) {
    console.log("Telegram sendMessage with buttons error:", error);
  }
};

const answerTelegramCallback = async (
  callbackQueryId: string,
  text?: string
) => {
  if (!TELEGRAM_BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
  } catch (error) {
    console.log("Telegram answerCallbackQuery error:", error);
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
      return "Send 1 to 8 photos now. When done, type done.";
    default:
      return "Send hi to start.";
  }
};

const QUICK_REQUIRED_TEXT_FIELDS = [
  "make",
  "model",
  "year",
  "transmission",
  "fuel",
  "km",
  "price",
  "location",
  "phone",
] as const;

type AiQuickParse = {
  make?: string | null;
  model?: string | null;
  variant?: string | null;
  year?: number | null;
  transmission?: string | null;
  fuel?: string | null;
  km?: number | null;
  price?: number | null;
  location?: string | null;
  color?: string | null;
  phone?: string | null;
  condition?: string | null;
};

const FIELD_LABELS: Record<string, string> = {
  make: "Make",
  model: "Model",
  variant: "Variant",
  year: "Year",
  transmission: "Transmission",
  fuel: "Fuel",
  km: "KM driven",
  price: "Price",
  location: "City",
  phone: "Phone number",
  photos: "Photos",
  color: "Color",
  condition: "Condition",
};

const formatPrice = (value: unknown) => {
  const num = typeof value === "number" ? value : null;
  return num ? `₹${num.toLocaleString("en-IN")}` : null;
};

const formatKm = (value: unknown) => {
  const num = typeof value === "number" ? value : null;
  return num ? num.toLocaleString("en-IN") : null;
};

const normalizeColor = (value: string) => {
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return null;
  return cleaned === "gray"
    ? "Grey"
    : cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const parseKm = (value: string) => {
  const num = parseNumber(value);
  if (!num) return null;
  if (/\bk\b/i.test(value)) return Math.round(num * 1_000);
  return Math.round(num);
};

const getQuickParseScore = (data: Record<string, unknown>) =>
  [
    data.make,
    data.model,
    data.year,
    data.price,
    data.km,
    data.fuel,
    data.transmission,
    data.location,
  ].filter(Boolean).length;

const toText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const buildQuickPreview = (
  data: Record<string, unknown>,
  photoCount: number,
  missingFields: string[]
) => {
  const lines = ["I found this:", ""];
  const previewFields: Array<[string, string | null]> = [
    ["Make", toText(data.make)],
    ["Model", toText(data.model)],
    ["Variant", toText(data.variant)],
    ["Year", typeof data.year === "number" ? String(data.year) : null],
    ["Transmission", toText(data.transmission)],
    ["Fuel", toText(data.fuel)],
    ["KM driven", formatKm(data.km)],
    ["Price", formatPrice(data.price)],
    ["City", toText(data.location)],
    ["Color", toText(data.color)],
    ["Phone number", toText(data.phone)],
  ];

  for (const [label, value] of previewFields) {
    if (value) lines.push(`${label}: ${value}`);
  }

  lines.push(`Photos: ${photoCount}/8`);

  if (missingFields.length > 0) {
    lines.push("", "Missing:");
    for (const field of missingFields) {
      lines.push(`- ${FIELD_LABELS[field] ?? field}`);
    }
  } else {
    lines.push("", "Everything looks complete.");
  }

  lines.push(
    "",
    "Use the buttons below or type:",
    "confirm",
    "edit field value",
    "cancel"
  );

  return lines.join("\n");
};

const getQuickMissingFields = (
  data: Record<string, unknown>,
  photoCount: number
): string[] => {
  const missing: string[] = QUICK_REQUIRED_TEXT_FIELDS.filter((field) => {
    const value = data[field];
    if (typeof value === "number") return !Number.isFinite(value);
    return !(typeof value === "string" && value.trim());
  });
  if (photoCount < 1) missing.push("photos");
  return missing;
};

const parseFieldValue = (field: string, rawValue: string) => {
  switch (field) {
    case "make":
    case "model":
    case "variant":
    case "location":
      return titleCase(rawValue);
    case "year": {
      const year = Number(rawValue.replace(/[^0-9]/g, ""));
      return year >= 1990 && year <= 2100 ? year : null;
    }
    case "transmission":
      return normalizeTransmission(rawValue);
    case "fuel":
      return normalizeFuel(rawValue);
    case "km":
      return parseKm(rawValue);
    case "price":
      return parseIndianMoney(rawValue);
    case "phone": {
      const digits = rawValue.replace(/\D/g, "");
      return digits.length >= 10 ? digits : null;
    }
    case "condition":
      return normalizeCondition(rawValue);
    case "color":
      return normalizeColor(rawValue);
    default:
      return titleCase(rawValue);
  }
};

const safeJsonParse = (value: string) => {
  try {
    return JSON.parse(value) as AiQuickParse;
  } catch {
    return null;
  }
};

const normalizeAiParse = (raw: AiQuickParse | null): Partial<AiQuickParse> | null => {
  if (!raw) return null;

  const normalized: Partial<AiQuickParse> = {};

  if (raw.make) normalized.make = titleCase(String(raw.make));
  if (raw.model) normalized.model = titleCase(String(raw.model));
  if (raw.variant) normalized.variant = titleCase(String(raw.variant));
  if (raw.location) normalized.location = titleCase(String(raw.location));
  if (raw.color) normalized.color = normalizeColor(String(raw.color)) ?? null;
  if (raw.transmission) {
    normalized.transmission = normalizeTransmission(String(raw.transmission));
  }
  if (raw.fuel) {
    normalized.fuel = normalizeFuel(String(raw.fuel));
  }
  if (raw.condition) {
    normalized.condition = normalizeCondition(String(raw.condition));
  }

  const year =
    typeof raw.year === "number"
      ? raw.year
      : Number(String(raw.year ?? "").replace(/[^0-9]/g, ""));
  if (year >= 1990 && year <= 2100) normalized.year = year;

  const km =
    typeof raw.km === "number" ? raw.km : parseKm(String(raw.km ?? ""));
  if (typeof km === "number" && Number.isFinite(km) && km > 0) normalized.km = km;

  const price =
    typeof raw.price === "number"
      ? Math.round(raw.price)
      : parseIndianMoney(String(raw.price ?? ""));
  if (typeof price === "number" && Number.isFinite(price) && price > 0) {
    normalized.price = price;
  }

  const phoneDigits = String(raw.phone ?? "").replace(/\D/g, "");
  if (phoneDigits.length >= 10) normalized.phone = phoneDigits;

  return normalized;
};

const parseListingWithAi = async (
  text: string
): Promise<Partial<AiQuickParse> | null> => {
  if (!OPENAI_API_KEY) return null;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_PARSER_MODEL,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract used car listing details from one user message. Return only valid JSON with keys: make, model, variant, year, transmission, fuel, km, price, location, color, phone, condition. Use null for anything missing. Convert price and km to plain numbers in INR and KM.",
          },
          {
            role: "user",
            content: text,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.log("Telegram AI parser failed:", response.status, await response.text());
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) return null;
    return normalizeAiParse(safeJsonParse(content));
  } catch (error) {
    console.log("Telegram AI parser error:", error);
    return null;
  }
};

const applyEditCommand = (
  commandText: string,
  data: Record<string, unknown>
) => {
  const match = commandText.match(/^edit\s+([a-z ]+?)\s+(.+)$/i);
  if (!match) return { error: "Use: edit field value" };

  const rawField = match[1].trim().toLowerCase();
  const rawValue = match[2].trim();
  const fieldMap: Record<string, string> = {
    make: "make",
    model: "model",
    variant: "variant",
    year: "year",
    transmission: "transmission",
    gearbox: "transmission",
    fuel: "fuel",
    km: "km",
    mileage: "km",
    price: "price",
    city: "location",
    location: "location",
    phone: "phone",
    number: "phone",
    condition: "condition",
    color: "color",
  };

  const field = fieldMap[rawField];
  if (!field) {
    return { error: "Unknown field. Try edit price 15 lakh" };
  }

  const parsed = parseFieldValue(field, rawValue);
  if (parsed === null || parsed === "") {
    return { error: `Could not understand ${FIELD_LABELS[field] ?? field}.` };
  }

  return {
    data: {
      ...data,
      [field]: parsed,
    },
  };
};

const mergeQuickParsedData = async (
  existingData: Record<string, unknown>,
  text: string
) => {
  const parsed = parseListingText(text);
  const nextData = { ...existingData };

  for (const field of [
    "make",
    "model",
    "variant",
    "year",
    "price",
    "km",
    "fuel",
    "transmission",
    "location",
    "color",
  ] as const) {
    const value = parsed[field];
    if (
      value !== null &&
      value !== undefined &&
      !(typeof value === "string" && !value.trim())
    ) {
      nextData[field] = value;
    }
  }

  const phone = text.replace(/\D/g, "");
  if (phone.length >= 10) {
    nextData.phone = phone;
  }

  const condition = normalizeCondition(text);
  if (condition) {
    nextData.condition = condition;
  }

  const score = getQuickParseScore(nextData);
  const shouldUseAi =
    score < 6 ||
    !nextData.make ||
    !nextData.model ||
    !nextData.location ||
    (!nextData.price && /\b(lakh|lac|cr|k|₹|rs|inr)\b/i.test(text));

  if (shouldUseAi) {
    const aiParsed = await parseListingWithAi(text);
    if (aiParsed) {
      for (const [field, value] of Object.entries(aiParsed)) {
        if (
          value !== null &&
          value !== undefined &&
          !(typeof value === "string" && !value.trim())
        ) {
          nextData[field] = value;
        }
      }
    }
  }

  return nextData;
};

const shouldUseQuickMode = (text: string) => {
  const parsed = parseListingText(text);
  const score = [
    parsed.make,
    parsed.model,
    parsed.year,
    parsed.price,
    parsed.km,
    parsed.fuel,
    parsed.transmission,
    parsed.location,
  ].filter(Boolean).length;

  return Boolean(
    (parsed.make && parsed.model && score >= 5) ||
      (text.trim().split(/\s+/).length >= 5 && /\d/.test(text))
  );
};

export async function POST(req: Request) {
  if (TELEGRAM_WEBHOOK_SECRET) {
    const secret = req.headers.get("x-telegram-bot-api-secret-token");
    if (secret !== TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: true });
    }
  }

  const body = await req.json();
  const callbackQuery = body?.callback_query;
  const message = callbackQuery?.message ?? body?.message;
  if (!message) return NextResponse.json({ ok: true });

  const chat = message.chat;
  if (chat?.type !== "private") {
    console.log("Telegram ignored non-private chat:", chat?.type, chat?.id);
    return NextResponse.json({ ok: true });
  }

  const chatId = chat.id as number;
  const user = callbackQuery?.from ?? message.from;
  const userId = user?.id as number | undefined;
  const username = user?.username ?? null;
  const displayName =
    username
      ? `@${username}`
      : [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        `User ${userId}`;
  if (!userId) return NextResponse.json({ ok: true });

  const text = callbackQuery?.data || message.text || message.caption || "";
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

  if (callbackQuery?.id) {
    await answerTelegramCallback(callbackQuery.id);
  }

  if (command === "/cancel") {
    await sb.from("telegram_sessions").delete().eq("user_id", userId);
    await sendTelegramMessage(chatId, "Cancelled. Send hi to start again.");
    await broadcast(`${displayName} cancelled a listing flow.`);
    return NextResponse.json({ ok: true });
  }

  if (command === "/post" || command === "hi" || command === "hello" || command === "start") {
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
    if (trimmedText && shouldUseQuickMode(trimmedText)) {
      const payload = {
        user_id: userId,
        chat_id: chatId,
        username,
        step: "quick_preview",
        data: {},
        photo_file_ids: [...photoIds].slice(0, 8),
      };
      await sb.from("telegram_sessions").upsert(payload, { onConflict: "user_id" });
      const { data: freshSession } = await sb
        .from("telegram_sessions")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (freshSession) {
        const freshPhotos = Array.isArray(freshSession.photo_file_ids)
          ? [...freshSession.photo_file_ids]
          : [];
        const freshData = (freshSession.data ?? {}) as Record<string, unknown>;
        const nextData = await mergeQuickParsedData(freshData, trimmedText);
        if (!nextData.condition) nextData.condition = "Good";
        await sb
          .from("telegram_sessions")
          .update({ data: nextData, photo_file_ids: freshPhotos, step: "quick_preview" })
          .eq("user_id", userId);
        await sendTelegramMessage(
          chatId,
          buildQuickPreview(nextData, freshPhotos.length, getQuickMissingFields(nextData, freshPhotos.length))
        );
        await broadcast(`${displayName} started a quick Telegram listing.`);
        return NextResponse.json({ ok: true });
      }
    }
    await sendTelegramMessage(chatId, "Send hi to start listing a car.");
    return NextResponse.json({ ok: true });
  }

  const data = (session.data ?? {}) as Record<string, unknown>;
  const existingPhotos = Array.isArray(session.photo_file_ids)
    ? [...session.photo_file_ids]
    : [];

  const updateSession = async (
    nextStep: string,
    nextData: Record<string, unknown>,
    photoFileIds: string[] = existingPhotos
  ) => {
    await sb
      .from("telegram_sessions")
      .update({
        step: nextStep,
        data: nextData,
        photo_file_ids: photoFileIds,
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

    const { urls: photoUrls, errors: photoErrors } = TELEGRAM_BOT_TOKEN
      ? await uploadTelegramPhotos(photoFileIds.slice(0, 8), folder)
      : { urls: [], errors: [] };

    const details = [
      data.condition ? `Condition: ${data.condition}` : null,
      data.color ? `Color: ${data.color}` : null,
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
      source: "individual",
      dealer_id: null,
      type: "used",
      status: "sold",
      make: data.make ?? null,
      model: data.model ?? null,
      variant: data.variant ?? null,
      year: data.year ?? null,
      price: data.price ?? null,
      km: data.km ?? null,
      fuel: data.fuel ?? null,
      transmission: data.transmission ?? null,
      location: data.location ?? null,
      description: markListingPendingApproval(description),
      photo_urls: photoUrls,
    };

    console.log("🚨 listings insert payload.source =", payload.source);
    console.log("🚨 allowed sources are dealer_feed / individual");
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

    const title = [data.year, data.make, data.model, data.variant]
      .filter(Boolean)
      .join(" ");
    await notifyPendingListing({
      id: created.id,
      title: title || "New Telegram listing",
      source: "telegram",
    });

    if (photoUrls.length === 0 && photoFileIds.length > 0) {
      await sendTelegramMessage(
        chatId,
        "Listing posted, but photos failed to upload. Please try sending the photos again."
      );
      if (photoErrors.length) {
        console.log("Telegram photo upload errors:", photoErrors);
      }
    }

    await sb.from("telegram_sessions").delete().eq("user_id", userId);
    const listingUrl = `${SITE_URL}/listing/${created.id}`;
    await sendTelegramMessage(chatId, `Listing posted ✅\n${listingUrl}`);
    await broadcast(
      `New listing by ${displayName}: ${data.make} ${data.model} (${data.year}) - ${data.price}\n${listingUrl}`
    );
  };

  const sendQuickPreview = async (
    nextData: Record<string, unknown>,
    nextPhotos: string[]
  ) => {
    const missing = getQuickMissingFields(nextData, nextPhotos.length);
    await updateSession("quick_preview", nextData, nextPhotos);
    await sendTelegramMessageWithButtons(
      chatId,
      buildQuickPreview(nextData, nextPhotos.length, missing),
      [
        [
          { text: "Confirm", callback_data: "quick_confirm" },
          { text: "Edit", callback_data: "quick_edit" },
          { text: "Cancel", callback_data: "quick_cancel" },
        ],
      ]
    );
  };

  const enterQuickMode = async (
    textValue: string,
    seedPhotos: string[] = existingPhotos
  ) => {
    const nextData = await mergeQuickParsedData({}, textValue);
    if (!nextData.condition) {
      nextData.condition = "Good";
    }
    await sendQuickPreview(nextData, seedPhotos);
    await broadcast(`${displayName} started a quick Telegram listing.`);
  };

  if (command === "edit") {
    await sendTelegramMessage(chatId, `Okay. ${nextPrompt(session.step)}`);
    return NextResponse.json({ ok: true });
  }

  if (command === "quick_cancel") {
    await sb.from("telegram_sessions").delete().eq("user_id", userId);
    await sendTelegramMessage(chatId, "Cancelled. Send hi to start again.");
    await broadcast(`${displayName} cancelled a listing flow.`);
    return NextResponse.json({ ok: true });
  }

  if (command === "quick_edit") {
    await sendTelegramMessage(
      chatId,
      "Type edit field value. Example: edit price 14 lakh"
    );
    return NextResponse.json({ ok: true });
  }

  if (session.step === "quick_preview") {
    const mergedPhotos =
      photoIds.size > 0 ? [...existingPhotos, ...photoIds].slice(0, 8) : existingPhotos;

    if (command === "confirm" || command === "quick_confirm") {
      const missingText = getQuickMissingFields(data, mergedPhotos.length).filter(
        (field) => field !== "photos"
      );
      if (missingText.length > 0) {
        const nextData = {
          ...data,
          quick_missing_fields: missingText,
        };
        await updateSession("quick_missing", nextData, mergedPhotos);
        await sendTelegramMessage(
          chatId,
          `Please send ${FIELD_LABELS[missingText[0]] ?? missingText[0]}.`
        );
        return NextResponse.json({ ok: true });
      }
      if (mergedPhotos.length < 1) {
        await updateSession("photos", data, mergedPhotos);
        await sendTelegramMessage(chatId, nextPrompt("photos"));
        return NextResponse.json({ ok: true });
      }
      await finalizeListing(mergedPhotos);
      return NextResponse.json({ ok: true });
    }

    if (command.startsWith("edit ")) {
      const edited = applyEditCommand(trimmedText, data);
      if (edited.error) {
        await sendTelegramMessage(chatId, edited.error);
        return NextResponse.json({ ok: true });
      }
      await sendQuickPreview(edited.data ?? data, mergedPhotos);
      return NextResponse.json({ ok: true });
    }

    if (photoIds.size > 0 && !trimmedText) {
      await sendQuickPreview(data, mergedPhotos);
      return NextResponse.json({ ok: true });
    }

    if (trimmedText) {
      const nextData = await mergeQuickParsedData(data, trimmedText);
      await sendQuickPreview(nextData, mergedPhotos);
      return NextResponse.json({ ok: true });
    }
  }

  if (session.step === "quick_missing") {
    const mergedPhotos =
      photoIds.size > 0 ? [...existingPhotos, ...photoIds].slice(0, 8) : existingPhotos;
    const queuedFields = Array.isArray(data.quick_missing_fields)
      ? data.quick_missing_fields.map((item) => String(item))
      : [];
    const remainingFields = queuedFields.filter((field) => field !== "photos");

    if (command.startsWith("edit ")) {
      const edited = applyEditCommand(trimmedText, data);
      if (edited.error) {
        await sendTelegramMessage(chatId, edited.error);
        return NextResponse.json({ ok: true });
      }
      const nextMissing = getQuickMissingFields(edited.data ?? data, mergedPhotos.length).filter(
        (field) => field !== "photos"
      );
      if (nextMissing.length === 0) {
        if (mergedPhotos.length < 1) {
          await updateSession("photos", edited.data ?? data, mergedPhotos);
          await sendTelegramMessage(chatId, nextPrompt("photos"));
          return NextResponse.json({ ok: true });
        }
        await finalizeListing(mergedPhotos);
        return NextResponse.json({ ok: true });
      }
      await updateSession(
        "quick_missing",
        { ...(edited.data ?? data), quick_missing_fields: nextMissing },
        mergedPhotos
      );
      await sendTelegramMessage(
        chatId,
        `Please send ${FIELD_LABELS[nextMissing[0]] ?? nextMissing[0]}.`
      );
      return NextResponse.json({ ok: true });
    }

    if (remainingFields.length === 0) {
      if (mergedPhotos.length < 1) {
        await updateSession("photos", data, mergedPhotos);
        await sendTelegramMessage(chatId, nextPrompt("photos"));
        return NextResponse.json({ ok: true });
      }
      await finalizeListing(mergedPhotos);
      return NextResponse.json({ ok: true });
    }

    const currentField = remainingFields[0];
    if (!trimmedText) {
      await sendTelegramMessage(
        chatId,
        `Please send ${FIELD_LABELS[currentField] ?? currentField}.`
      );
      return NextResponse.json({ ok: true });
    }

    const parsedValue = parseFieldValue(currentField, trimmedText);
    if (parsedValue === null || parsedValue === "") {
      await sendTelegramMessage(
        chatId,
        `Could not understand ${FIELD_LABELS[currentField] ?? currentField}. Please try again.`
      );
      return NextResponse.json({ ok: true });
    }

    const nextData = { ...data, [currentField]: parsedValue };
    const nextMissing = getQuickMissingFields(nextData, mergedPhotos.length).filter(
      (field) => field !== "photos"
    );

    if (nextMissing.length > 0) {
      await updateSession(
        "quick_missing",
        { ...nextData, quick_missing_fields: nextMissing },
        mergedPhotos
      );
      await sendTelegramMessage(
        chatId,
        `Got it. Now send ${FIELD_LABELS[nextMissing[0]] ?? nextMissing[0]}.`
      );
      return NextResponse.json({ ok: true });
    }

    if (mergedPhotos.length < 1) {
      await updateSession("photos", nextData, mergedPhotos);
      await sendTelegramMessage(chatId, nextPrompt("photos"));
      return NextResponse.json({ ok: true });
    }

    await finalizeListing(mergedPhotos);
    return NextResponse.json({ ok: true });
  }

  if (session.step === "photos") {
    if (command === "/done" || command === "done") {
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
      await sendTelegramMessage(
        chatId,
        `Photo received (${nextPhotos.length}/8). Send more or type done.`
      );
      return NextResponse.json({ ok: true });
    }

    await sendTelegramMessage(chatId, "Send photos (1-8) or type done.");
    return NextResponse.json({ ok: true });
  }

  if (!trimmedText) {
    await sendTelegramMessage(chatId, "Please reply with text.");
    return NextResponse.json({ ok: true });
  }

  if (
    ["make", "model", "variant"].includes(session.step) &&
    shouldUseQuickMode(trimmedText)
  ) {
    await enterQuickMode(trimmedText, existingPhotos);
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
      await sendTelegramMessage(chatId, "Send hi to start listing a car.");
    }
  }

  return NextResponse.json({ ok: true });
}
