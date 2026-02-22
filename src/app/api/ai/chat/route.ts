import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

type Lang = "en" | "hi" | "pa";

type RequestPayload = {
  message?: string;
  lang?: Lang | string;
};

type ListingRow = {
  id: string;
  dealer_id: string | null;
  make: string | null;
  model: string | null;
  variant: string | null;
  year: number | null;
  price: number | null;
  fuel: string | null;
  transmission: string | null;
  location: string | null;
};

type DealerRow = {
  id: string;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
};

const texts = {
  en: {
    askCarType: "Please type what kind of car you need.",
    faqFinance:
      "You can start financing from the listing page via EMI and callback request. I can also find cars in your budget first.",
    faqTradeIn:
      "Use Instant Trade-In Value on listing pages. Add VIN and ZIP/PIN for live provider-based estimates.",
    faqDocs:
      "You can complete paperwork from Remote Docs and continue in showroom with Unified Dealmaking.",
    listingError:
      "I could not access live listings right now. Please try again in a moment.",
    foundMatches:
      "I found {count} strong matches from live inventory. Tap any result to open details.",
    noMatches:
      "I could not find a close match yet. Try raising budget slightly or removing one filter.",
    reasonWithinBudget: "within budget",
    reasonCloseBudget: "close to budget",
    reasonKeywords: "matches your keywords",
    reasonFamily: "family friendly",
    reasonSuv: "SUV fit",
    reasonCity: "in {city}",
    reasonFallback: "good overall match",
    handoffDealer:
      "I added direct dealer WhatsApp and call options below for faster contact.",
    handoffSupport:
      "I could not find dealer contact on these listings. Use support WhatsApp below.",
    supportLabel: "Chat on WhatsApp support",
    waDealerLabel: "WhatsApp dealer",
    waSupportText:
      "Hi CarHub support, I need help finding a car and contacting dealer.",
  },
  hi: {
    askCarType: "कृपया बताइए आपको किस तरह की कार चाहिए।",
    faqFinance:
      "आप लिस्टिंग पेज से EMI और callback request शुरू कर सकते हैं। मैं पहले आपके बजट की कारें भी ढूंढ सकता हूँ।",
    faqTradeIn:
      "लिस्टिंग पेज पर Instant Trade-In Value इस्तेमाल करें। live provider estimate के लिए VIN और ZIP/PIN डालें।",
    faqDocs:
      "आप Remote Docs में paperwork पूरा कर सकते हैं और Unified Dealmaking से showroom में आगे बढ़ सकते हैं।",
    listingError:
      "अभी live listings access नहीं हो पा रही हैं। कृपया थोड़ी देर बाद फिर कोशिश करें।",
    foundMatches:
      "मुझे live inventory से {count} अच्छे matches मिले हैं। किसी भी result पर tap करके details खोलें।",
    noMatches:
      "अभी exact match नहीं मिला। budget थोड़ा बढ़ाकर या एक filter हटाकर फिर try करें।",
    reasonWithinBudget: "बजट के अंदर",
    reasonCloseBudget: "बजट के करीब",
    reasonKeywords: "आपके keywords से match",
    reasonFamily: "family use के लिए बेहतर",
    reasonSuv: "SUV fit",
    reasonCity: "{city} में",
    reasonFallback: "overall अच्छा match",
    handoffDealer:
      "नीचे मैंने direct dealer WhatsApp और call options जोड़ दिए हैं।",
    handoffSupport:
      "इन listings में dealer contact नहीं मिला। नीचे support WhatsApp इस्तेमाल करें।",
    supportLabel: "WhatsApp support पर बात करें",
    waDealerLabel: "Dealer को WhatsApp",
    waSupportText:
      "Hi CarHub support, मुझे कार ढूंढने और dealer contact में मदद चाहिए।",
  },
  pa: {
    askCarType: "ਕਿਰਪਾ ਕਰਕੇ ਦੱਸੋ ਤੁਹਾਨੂੰ ਕਿਹੜੀ ਕਿਸਮ ਦੀ ਕਾਰ ਚਾਹੀਦੀ ਹੈ।",
    faqFinance:
      "ਤੁਸੀਂ listing page ਤੋਂ EMI ਤੇ callback request ਸ਼ੁਰੂ ਕਰ ਸਕਦੇ ਹੋ। ਮੈਂ ਪਹਿਲਾਂ ਤੁਹਾਡੇ budget ਵਾਲੀਆਂ cars ਵੀ ਲੱਭ ਸਕਦਾ ਹਾਂ।",
    faqTradeIn:
      "Listing page ‘ਤੇ Instant Trade-In Value ਵਰਤੋ। live provider estimate ਲਈ VIN ਅਤੇ ZIP/PIN ਦਿਓ।",
    faqDocs:
      "ਤੁਸੀਂ Remote Docs ‘ਚ paperwork ਪੂਰਾ ਕਰ ਸਕਦੇ ਹੋ ਅਤੇ Unified Dealmaking ਨਾਲ showroom ‘ਚ ਅੱਗੇ ਵੱਧ ਸਕਦੇ ਹੋ।",
    listingError:
      "ਹੁਣੇ live listings access ਨਹੀਂ ਹੋ ਰਹੀਆਂ। ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    foundMatches:
      "ਮੈਨੂੰ live inventory ਤੋਂ {count} ਵਧੀਆ matches ਮਿਲੇ ਹਨ। result ‘ਤੇ tap ਕਰਕੇ details ਖੋਲ੍ਹੋ।",
    noMatches:
      "ਹੁਣੇ close match ਨਹੀਂ ਮਿਲਿਆ। budget ਥੋੜ੍ਹਾ ਵਧਾ ਕੇ ਜਾਂ ਇੱਕ filter ਹਟਾ ਕੇ ਦੁਬਾਰਾ try ਕਰੋ।",
    reasonWithinBudget: "budget ਦੇ ਅੰਦਰ",
    reasonCloseBudget: "budget ਦੇ ਨੇੜੇ",
    reasonKeywords: "ਤੁਹਾਡੇ keywords ਨਾਲ match",
    reasonFamily: "family ਲਈ ਵਧੀਆ",
    reasonSuv: "SUV fit",
    reasonCity: "{city} ਵਿੱਚ",
    reasonFallback: "overall ਵਧੀਆ match",
    handoffDealer:
      "ਹੇਠਾਂ direct dealer WhatsApp ਅਤੇ call options ਦੇ ਦਿੱਤੇ ਹਨ।",
    handoffSupport:
      "ਇਨ੍ਹਾਂ listings ਲਈ dealer contact ਨਹੀਂ ਮਿਲਿਆ। ਹੇਠਾਂ support WhatsApp ਵਰਤੋ।",
    supportLabel: "WhatsApp support ਨਾਲ ਗੱਲ ਕਰੋ",
    waDealerLabel: "Dealer ਨੂੰ WhatsApp",
    waSupportText:
      "Hi CarHub support, ਮੈਨੂੰ car ਲੱਭਣ ਤੇ dealer contact ਲਈ ਮਦਦ ਚਾਹੀਦੀ ਹੈ।",
  },
} as const;

const familyHints = [
  "innova",
  "carens",
  "ertiga",
  "xl6",
  "safari",
  "xuv700",
  "scorpio",
];

const suvHints = ["creta", "seltos", "harrier", "xuv", "venue", "taigun", "kushaq"];

const stopWords = new Set([
  "best",
  "car",
  "cars",
  "with",
  "for",
  "under",
  "near",
  "city",
  "please",
  "want",
  "need",
  "the",
  "and",
  "or",
  "show",
  "me",
  "find",
  "help",
]);

const normalize = (value?: string | null) =>
  (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();

const toTitle = (value?: string | null) =>
  value
    ? value
        .split(" ")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "";

const t = (lang: Lang, key: keyof (typeof texts)["en"], params?: Record<string, string>) => {
  let value = String(texts[lang][key] ?? texts.en[key]);
  if (!params) return value;
  for (const [name, token] of Object.entries(params)) {
    value = value.replaceAll(`{${name}}`, token);
  }
  return value;
};

const detectLang = (message: string, preferred?: string): Lang => {
  if (preferred === "hi" || preferred === "pa" || preferred === "en") return preferred;
  if (/[\u0A00-\u0A7F]/.test(message)) return "pa";
  if (/[\u0900-\u097F]/.test(message)) return "hi";
  return "en";
};

const parseBudget = (message: string) => {
  const lowered = message.toLowerCase();
  const crore = lowered.match(/(\d+(?:\.\d+)?)\s*(cr|crore|करोड़|करोड|ਕਰੋੜ)/);
  if (crore) return Number(crore[1]) * 10_000_000;
  const lakh = lowered.match(/(\d+(?:\.\d+)?)\s*(l|lac|lakh|लाख|ਲੱਖ)/);
  if (lakh) return Number(lakh[1]) * 100_000;
  const plain = lowered.match(/\b(\d{5,8})\b/);
  if (plain) return Number(plain[1]);
  return null;
};

const parseCity = (message: string) => {
  const patterns = [
    /\bin\s+([\p{L}\s]{2,30})/u,
    /में\s+([\p{L}\s]{2,30})/u,
    /ਵਿੱਚ\s+([\p{L}\s]{2,30})/u,
  ];
  for (const pattern of patterns) {
    const match = message.toLowerCase().match(pattern);
    if (!match) continue;
    const raw = match[1]
      .replace(
        /\b(under|below|around|near|with|for|में|ਵਿੱਚ|budget|ਬਜਟ|बजट)\b.*$/u,
        ""
      )
      .trim();
    if (raw.length >= 2) return raw;
  }
  return null;
};

const getFaqReply = (message: string, lang: Lang) => {
  const lowered = message.toLowerCase();
  if (/(finance|loan|emi|फाइनेंस|लोन|ਕਰਜ਼|ਫਾਇਨੈਂਸ)/.test(lowered)) {
    return t(lang, "faqFinance");
  }
  if (/(trade[-\s]?in|exchange|old car|एक्सचेंज|पुरानी कार|ਐਕਸਚੇਂਜ|ਪੁਰਾਣੀ ਕਾਰ)/.test(lowered)) {
    return t(lang, "faqTradeIn");
  }
  if (/(document|paperwork|rc|insurance|दस्तावेज|पेपर|ਕਾਗਜ਼|ਦਸਤਾਵੇਜ਼)/.test(lowered)) {
    return t(lang, "faqDocs");
  }
  return null;
};

const wantsDealerContact = (message: string) =>
  /(dealer|contact|call|phone|number|whatsapp|chat|talk|connect|owner|कॉल|फोन|नंबर|नम्बर|संपर्क|व्हाट्स|ਡੀਲਰ|ਕਾਲ|ਫੋਨ|ਨੰਬਰ|ਸੰਪਰਕ|ਵਟਸਐਪ)/i.test(
    message
  );

const tokenize = (message: string) =>
  message
    .toLowerCase()
    .replace(/[^\p{L}0-9\s]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !stopWords.has(token));

const normalizePhone = (value?: string | null) => {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  return digits;
};

const buildWhatsappLink = (phone?: string | null, text?: string) => {
  const digits = normalizePhone(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(
    text ?? "Hi, I am interested in this car listing."
  )}`;
};

const getSupportHandoff = (lang: Lang) => {
  const supportNumber =
    process.env.SUPPORT_WHATSAPP_NUMBER ??
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER ??
    "";
  const digits = normalizePhone(supportNumber);
  if (!digits) return null;
  return {
    label: t(lang, "supportLabel"),
    url: `https://wa.me/${digits}?text=${encodeURIComponent(t(lang, "waSupportText"))}`,
  };
};

const getQuickReplies = (lang: Lang, forFaq = false) => {
  if (lang === "hi") {
    return forFaq
      ? ["15 लाख में SUV", "20 लाख में Electric car", "7 seater family car"]
      : ["18 लाख में automatic SUV", "20 लाख में diesel 7 seater", "25 लाख में EV"];
  }
  if (lang === "pa") {
    return forFaq
      ? ["15 ਲੱਖ ਵਿੱਚ SUV", "20 ਲੱਖ ਵਿੱਚ Electric car", "7 seater family car"]
      : ["18 ਲੱਖ ਵਿੱਚ automatic SUV", "20 ਲੱਖ ਵਿੱਚ diesel 7 seater", "25 ਲੱਖ ਵਿੱਚ EV"];
  }
  return forFaq
    ? ["SUV under 15 lakh", "Electric car under 20 lakh", "7 seater family car"]
    : ["Automatic SUV under 18 lakh", "Diesel 7 seater under 20 lakh", "EV under 25 lakh"];
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as RequestPayload;
  const message = String(body.message ?? "").trim();
  const lang = detectLang(message, String(body.lang ?? "").trim().toLowerCase());
  if (!message) {
    return NextResponse.json({ reply: t(lang, "askCarType") }, { status: 400 });
  }

  const supportHandoff = getSupportHandoff(lang);
  const faqReply = getFaqReply(message, lang);
  if (faqReply) {
    return NextResponse.json({
      reply: faqReply,
      recommendations: [],
      quickReplies: getQuickReplies(lang, true),
      handoff: supportHandoff ?? undefined,
      lang,
    });
  }

  const budget = parseBudget(message);
  const city = parseCity(message);
  const wantsElectric = /(electric|ev|इलेक्ट्रिक|ਬਿਜਲੀ)/i.test(message);
  const wantsSuv = /\bsuv\b|एसयूवी|ਐਸਯੂਵੀ/i.test(message);
  const wantsFamily = /(family|7 seater|five|kids|child|परिवार|ਫੈਮਲੀ)/i.test(message);
  const wantsAutomatic = /automatic|amt|cvt|ऑटोमैटिक|ਆਟੋਮੈਟਿਕ/i.test(message);
  const contactIntent = wantsDealerContact(message);
  const tokens = tokenize(message);

  const sb = supabaseServer();
  let query = sb
    .from("listings")
    .select(
      "id, dealer_id, make, model, variant, year, price, fuel, transmission, location"
    )
    .eq("status", "available")
    .limit(320);

  if (budget && budget > 0) query = query.lte("price", Math.round(budget * 1.2));
  if (wantsElectric) query = query.ilike("fuel", "%electric%");
  if (city) query = query.ilike("location", `%${city}%`);
  if (wantsAutomatic) query = query.ilike("transmission", "%automatic%");

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({
      reply: t(lang, "listingError"),
      recommendations: [],
      quickReplies: getQuickReplies(lang),
      handoff: supportHandoff ?? undefined,
      lang,
    });
  }

  const rows = (data ?? []) as ListingRow[];
  const scored = rows
    .map((row) => {
      const joined = normalize(
        `${row.make ?? ""} ${row.model ?? ""} ${row.variant ?? ""} ${row.fuel ?? ""} ${row.transmission ?? ""}`
      );
      let score = 0;
      const reasons: string[] = [];

      if (budget && row.price && row.price <= budget) {
        score += 4;
        reasons.push(t(lang, "reasonWithinBudget"));
      } else if (budget && row.price && row.price <= budget * 1.1) {
        score += 2;
        reasons.push(t(lang, "reasonCloseBudget"));
      }

      const keywordHits = tokens.filter((token) => joined.includes(token)).length;
      if (keywordHits > 0) {
        score += keywordHits * 2;
        reasons.push(t(lang, "reasonKeywords"));
      }

      if (wantsFamily && familyHints.some((hint) => joined.includes(hint))) {
        score += 2;
        reasons.push(t(lang, "reasonFamily"));
      }
      if (wantsSuv && suvHints.some((hint) => joined.includes(hint))) {
        score += 2;
        reasons.push(t(lang, "reasonSuv"));
      }
      if (wantsElectric && normalize(row.fuel).includes("electric")) {
        score += 3;
      }
      if (wantsAutomatic && normalize(row.transmission).includes("automatic")) {
        score += 2;
      }
      if (city && normalize(row.location).includes(city)) {
        score += 2;
        reasons.push(t(lang, "reasonCity", { city }));
      }
      if (row.year && row.year >= 2021) {
        score += 1;
      }

      return {
        row,
        score,
        reason: reasons.slice(0, 2).join(" • ") || t(lang, "reasonFallback"),
      };
    })
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 4);
  const dealerIds = Array.from(
    new Set(top.map((item) => item.row.dealer_id).filter(Boolean))
  ) as string[];

  const dealerMap = new Map<string, DealerRow>();
  if (dealerIds.length > 0) {
    const { data: dealerData } = await sb
      .from("dealers")
      .select("id, name, phone, whatsapp")
      .in("id", dealerIds);
    for (const dealer of (dealerData ?? []) as DealerRow[]) {
      dealerMap.set(dealer.id, dealer);
    }
  }

  const recommendations = top.map((item) => {
    const title = `${item.row.year ?? ""} ${toTitle(item.row.make)} ${toTitle(
      item.row.model
    )} ${toTitle(item.row.variant)}`.replace(/\s+/g, " ").trim();
    const dealer = item.row.dealer_id ? dealerMap.get(item.row.dealer_id) : null;
    const dealerPhone = dealer?.whatsapp ?? dealer?.phone ?? null;
    return {
      id: item.row.id,
      title,
      price: item.row.price,
      location: item.row.location,
      reason: item.reason,
      dealerName: dealer?.name ?? null,
      whatsappLink: buildWhatsappLink(
        dealerPhone,
        `Hi, I am interested in ${title} on CarHub. Please share details.`
      ),
      callLink: normalizePhone(dealer?.phone) ? `tel:${normalizePhone(dealer?.phone)}` : null,
      waLabel: t(lang, "waDealerLabel"),
    };
  });

  const hasDealerContact = recommendations.some((item) => item.whatsappLink || item.callLink);
  const defaultReply =
    recommendations.length > 0
      ? t(lang, "foundMatches", { count: String(recommendations.length) })
      : t(lang, "noMatches");

  const reply =
    contactIntent && hasDealerContact
      ? t(lang, "handoffDealer")
      : contactIntent && !hasDealerContact && supportHandoff
        ? t(lang, "handoffSupport")
        : defaultReply;

  return NextResponse.json({
    reply,
    recommendations,
    quickReplies: getQuickReplies(lang),
    handoff: contactIntent ? supportHandoff ?? undefined : undefined,
    lang,
  });
}
