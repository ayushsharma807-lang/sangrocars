"use client";

import { useMemo, useRef, useState } from "react";
import { parseListingText } from "@/lib/listingTextParser";

type VoicePatch = {
  type?: string;
  status?: string;
  make?: string;
  model?: string;
  variant?: string;
  year?: string;
  price?: string;
  km?: string;
  fuel?: string;
  transmission?: string;
  location?: string;
  description?: string;
};

type Props = {
  onApply: (patch: VoicePatch) => void;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const toText = (value: number | null) =>
  value == null ? undefined : String(value);

export default function VoicePostHelper({ onApply }: Props) {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const isSupported = useMemo(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    []
  );

  const applyFromText = (value: string) => {
    if (!value.trim()) return;
    const parsed = parseListingText(value);
    onApply({
      type: parsed.type,
      status: parsed.status,
      make: parsed.make ?? undefined,
      model: parsed.model ?? undefined,
      variant: parsed.variant ?? undefined,
      year: toText(parsed.year),
      price: toText(parsed.price),
      km: toText(parsed.km),
      fuel: parsed.fuel ?? undefined,
      transmission: parsed.transmission ?? undefined,
      location: parsed.location ?? undefined,
      description: parsed.description ?? undefined,
    });
  };

  const startListening = () => {
    if (!isSupported) {
      setError("Voice input is not supported in this browser.");
      return;
    }
    setError("");
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    recognition.onresult = (event) => {
      const chunks: string[] = [];
      for (const result of Array.from(event.results)) {
        const part = result?.[0]?.transcript;
        if (part) chunks.push(part);
      }
      setTranscript(chunks.join(" ").trim());
    };
    recognition.onerror = (event) => {
      setError(event.error ? `Voice error: ${event.error}` : "Voice capture failed.");
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  return (
    <div className="voice-helper">
      <div className="voice-helper__actions">
        {!isListening ? (
          <button className="btn btn--outline" type="button" onClick={startListening}>
            Start voice post
          </button>
        ) : (
          <button className="btn btn--ghost" type="button" onClick={stopListening}>
            Stop listening
          </button>
        )}
        <button
          className="btn btn--solid"
          type="button"
          onClick={() => applyFromText(transcript)}
          disabled={!transcript.trim()}
        >
          Fill from voice
        </button>
      </div>

      <label>
        Voice text (you can edit if needed)
        <textarea
          rows={3}
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          placeholder="Say or type: Hyundai Creta 2021 petrol automatic 42000 km price 12.9 lakh city Jalandhar"
        />
      </label>
      {error ? <p className="dealer-wizard__error">{error}</p> : null}
    </div>
  );
}
