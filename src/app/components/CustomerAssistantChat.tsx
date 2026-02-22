"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Lang = "en" | "hi" | "pa";

type ChatRecommendation = {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  reason: string;
  dealerName?: string | null;
  whatsappLink?: string | null;
  callLink?: string | null;
  waLabel?: string | null;
};

type ChatHandoff = {
  label: string;
  url: string;
};

type Message = {
  id: string;
  role: "bot" | "user";
  text: string;
  recommendations?: ChatRecommendation[];
  quickReplies?: readonly string[];
  handoff?: ChatHandoff;
};

type ChatResponse = {
  reply: string;
  recommendations?: ChatRecommendation[];
  quickReplies?: readonly string[];
  handoff?: ChatHandoff;
  lang?: Lang;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const formatInr = (value: number | null) =>
  value ? `₹${Math.round(value).toLocaleString("en-IN")}` : "Price on request";

const ui = {
  en: {
    toggle: "Ask CarBot",
    title: "CarBot Assistant",
    subtitle: "Find cars fast from live listings",
    close: "Close",
    send: "Send",
    sending: "...",
    placeholder: "Ask for a car (budget + city + type)",
    voice: "Voice",
    stop: "Stop",
    voiceUnsupported: "Voice input is not supported in this browser.",
    sendError: "I could not respond right now. Please try again.",
    callDealer: "Call dealer",
    whatsappDealer: "WhatsApp dealer",
    viewDetails: "View details",
    langLabel: "Lang",
    welcome:
      "Hi, I can help you find the right car. Tell me budget, city, and type. Example: SUV under 15 lakh in Delhi.",
    welcomeQuick: [
      "SUV under 15 lakh",
      "7 seater family car under 20 lakh",
      "Electric car under 25 lakh",
    ],
  },
  hi: {
    toggle: "CarBot से पूछें",
    title: "CarBot Assistant",
    subtitle: "live listings से जल्दी car ढूंढें",
    close: "बंद करें",
    send: "भेजें",
    sending: "...",
    placeholder: "car पूछें (budget + city + type)",
    voice: "आवाज़",
    stop: "रोकें",
    voiceUnsupported: "इस browser में voice input supported नहीं है।",
    sendError: "अभी जवाब नहीं दे पा रहा हूँ। कृपया दोबारा कोशिश करें।",
    callDealer: "Dealer को कॉल",
    whatsappDealer: "Dealer को WhatsApp",
    viewDetails: "Details देखें",
    langLabel: "भाषा",
    welcome:
      "नमस्ते, मैं सही car ढूंढने में मदद कर सकता हूँ। budget, city और type बताएं। उदाहरण: 15 लाख में SUV दिल्ली में।",
    welcomeQuick: [
      "15 लाख में SUV",
      "20 लाख में 7 seater family car",
      "25 लाख में electric car",
    ],
  },
  pa: {
    toggle: "CarBot ਨੂੰ ਪੁੱਛੋ",
    title: "CarBot Assistant",
    subtitle: "live listings ਤੋਂ ਜਲਦੀ car ਲੱਭੋ",
    close: "ਬੰਦ ਕਰੋ",
    send: "ਭੇਜੋ",
    sending: "...",
    placeholder: "car ਬਾਰੇ ਪੁੱਛੋ (budget + city + type)",
    voice: "ਆਵਾਜ਼",
    stop: "ਰੋਕੋ",
    voiceUnsupported: "ਇਸ browser ਵਿੱਚ voice input support ਨਹੀਂ ਹੈ।",
    sendError: "ਹੁਣੇ ਜਵਾਬ ਨਹੀਂ ਦੇ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    callDealer: "Dealer ਨੂੰ ਕਾਲ",
    whatsappDealer: "Dealer ਨੂੰ WhatsApp",
    viewDetails: "Details ਵੇਖੋ",
    langLabel: "ਭਾਸ਼ਾ",
    welcome:
      "ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਤੁਹਾਨੂੰ ਸਹੀ car ਲੱਭਣ ਵਿੱਚ ਮਦਦ ਕਰਾਂਗਾ। budget, city ਤੇ type ਦੱਸੋ। ਉਦਾਹਰਨ: 15 ਲੱਖ ਵਿੱਚ SUV ਪੰਜਾਬ ਵਿੱਚ।",
    welcomeQuick: [
      "15 ਲੱਖ ਵਿੱਚ SUV",
      "20 ਲੱਖ ਵਿੱਚ 7 seater family car",
      "25 ਲੱਖ ਵਿੱਚ electric car",
    ],
  },
} as const;

const recognitionLang = {
  en: "en-IN",
  hi: "hi-IN",
  pa: "pa-IN",
} as const;

const buildWelcomeMessage = (lang: Lang): Message => ({
  id: crypto.randomUUID(),
  role: "bot",
  text: ui[lang].welcome,
  quickReplies: ui[lang].welcomeQuick,
});

const getSpeechConstructor = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") return null;
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
};

export default function CustomerAssistantChat() {
  const pathname = usePathname();
  const hidden = useMemo(
    () => pathname.startsWith("/admin") || pathname.startsWith("/dealer-admin"),
    [pathname]
  );
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: ui.en.welcome,
      quickReplies: ui.en.welcomeQuick,
    },
  ]);
  const feedRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    if (!feedRef.current) return;
    feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
    },
    []
  );

  if (hidden) return null;

  const pushUserMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        text,
      },
    ]);
  };

  const pushBotMessage = (payload: ChatResponse) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "bot",
        text: payload.reply,
        recommendations: payload.recommendations ?? [],
        quickReplies: payload.quickReplies ?? [],
        handoff: payload.handoff,
      },
    ]);
  };

  const sendMessage = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;

    pushUserMessage(text);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, lang }),
      });
      if (!response.ok) throw new Error("chat_failed");
      const payload = (await response.json()) as ChatResponse;
      pushBotMessage(payload);
    } catch {
      pushBotMessage({
        reply: ui[lang].sendError,
      });
    } finally {
      setLoading(false);
    }
  };

  const pushSystemReply = (text: string) => {
    pushBotMessage({
      reply: text,
      recommendations: [],
      quickReplies: ui[lang].welcomeQuick,
    });
  };

  const toggleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Ctor = getSpeechConstructor();
    if (!Ctor) {
      pushSystemReply(ui[lang].voiceUnsupported);
      return;
    }

    const recognition = new Ctor();
    recognition.lang = recognitionLang[lang];
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const first = event.results[0];
      const transcript = first?.[0]?.transcript?.trim() ?? "";
      if (!transcript) return;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => {
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const onLangChange = (next: Lang) => {
    if (next === lang) return;
    setLang(next);
    setMessages((prev) => [...prev, buildWelcomeMessage(next)]);
  };

  return (
    <>
      {!open && (
        <button className="chatbot-toggle" type="button" onClick={() => setOpen(true)}>
          {ui[lang].toggle}
        </button>
      )}

      {open && (
        <section className="chatbot" aria-label="Customer assistant chatbot">
          <header className="chatbot__header">
            <div>
              <strong>{ui[lang].title}</strong>
              <p>{ui[lang].subtitle}</p>
            </div>
            <div className="chatbot__top-actions">
              <label className="chatbot__lang">
                {ui[lang].langLabel}
                <select
                  value={lang}
                  onChange={(event) => onLangChange(event.target.value as Lang)}
                >
                  <option value="en">EN</option>
                  <option value="hi">HI</option>
                  <option value="pa">PA</option>
                </select>
              </label>
              <button
                className="chatbot__close"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
              >
                {ui[lang].close}
              </button>
            </div>
          </header>

          <div className="chatbot__feed" ref={feedRef}>
            {messages.map((message) => (
              <article
                key={message.id}
                className={`chatbot__msg ${
                  message.role === "user" ? "chatbot__msg--user" : "chatbot__msg--bot"
                }`}
              >
                <p>{message.text}</p>
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="chatbot__cards">
                    {message.recommendations.map((item) => (
                      <article className="chatbot__card" key={item.id}>
                        <Link className="chatbot__card-title" href={`/listing/${item.id}`}>
                          <strong>{item.title}</strong>
                          <span>{formatInr(item.price)}</span>
                          <span>{item.location || "Location on request"}</span>
                          {item.dealerName && <small>{item.dealerName}</small>}
                          <small>{item.reason}</small>
                        </Link>
                        <div className="chatbot__card-actions">
                          {item.whatsappLink && (
                            <a
                              href={item.whatsappLink}
                              target="_blank"
                              rel="noreferrer"
                              className="chatbot__cta"
                            >
                              {item.waLabel || ui[lang].whatsappDealer}
                            </a>
                          )}
                          {item.callLink && (
                            <a href={item.callLink} className="chatbot__cta chatbot__cta--light">
                              {ui[lang].callDealer}
                            </a>
                          )}
                          <Link
                            className="chatbot__cta chatbot__cta--light"
                            href={`/listing/${item.id}`}
                          >
                            {ui[lang].viewDetails}
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                {message.handoff && (
                  <a
                    className="chatbot__handoff"
                    href={message.handoff.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {message.handoff.label}
                  </a>
                )}
                {message.quickReplies && message.quickReplies.length > 0 && (
                  <div className="chatbot__quick">
                    {message.quickReplies.map((quick) => (
                      <button
                        type="button"
                        key={quick}
                        onClick={() => {
                          void sendMessage(quick);
                        }}
                        disabled={loading}
                      >
                        {quick}
                      </button>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>

          <form
            className="chatbot__input"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={ui[lang].placeholder}
            />
            <button
              type="button"
              onClick={toggleVoice}
              className="chatbot__mic"
              disabled={loading}
            >
              {listening ? ui[lang].stop : ui[lang].voice}
            </button>
            <button type="submit" disabled={loading}>
              {loading ? ui[lang].sending : ui[lang].send}
            </button>
          </form>
        </section>
      )}
    </>
  );
}
