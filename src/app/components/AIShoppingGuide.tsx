"use client";

import Link from "next/link";
import { useState } from "react";

type Recommendation = {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  reason: string;
};

type ResponsePayload = {
  summary: string;
  marketInsight: string;
  recommendations: Recommendation[];
  note: string;
};

const samplePrompts = [
  "Best electric SUV for family of five under 22 lakh",
  "Low-maintenance diesel SUV around 12 lakh",
  "City-friendly automatic hatchback under 10 lakh",
];

const formatInr = (value: number | null) =>
  value ? `₹${Math.round(value).toLocaleString("en-IN")}` : "Price on request";

export default function AIShoppingGuide() {
  const [question, setQuestion] = useState(samplePrompts[0]);
  const [budget, setBudget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResponsePayload | null>(null);

  const runGuide = async () => {
    if (!question.trim()) {
      setError("Please add your question.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/ai/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          budget: budget ? Number(budget) : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("ai_guide_failed");
      }

      const payload = (await response.json()) as ResponsePayload;
      setResult(payload);
    } catch {
      setError("AI guide is unavailable right now. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="experience-ai">
      <label>
        Ask the AI concierge
        <textarea
          rows={3}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What should I buy?"
        />
      </label>
      <label>
        Optional max budget (INR)
        <input
          type="number"
          value={budget}
          onChange={(event) => setBudget(event.target.value)}
          placeholder="e.g., 1800000"
        />
      </label>
      <div className="experience-ai__chips">
        {samplePrompts.map((prompt) => (
          <button
            type="button"
            className="experience-chip"
            key={prompt}
            onClick={() => setQuestion(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
      <button className="simple-button" onClick={runGuide} type="button" disabled={loading}>
        {loading ? "Finding best matches..." : "Get recommendations"}
      </button>
      {error && <p className="experience-error">{error}</p>}

      {result && (
        <div className="experience-ai__results">
          <p>{result.summary}</p>
          <p>{result.marketInsight}</p>
          <div className="experience-ai__cards">
            {result.recommendations.map((item) => (
              <article className="experience-card" key={item.id}>
                <h4>{item.title}</h4>
                <p>{formatInr(item.price)}</p>
                <p>{item.location || "Location on request"}</p>
                <p>{item.reason}</p>
                <Link className="simple-link-btn" href={`/listing/${item.id}`}>
                  View car
                </Link>
              </article>
            ))}
          </div>
          <p className="experience-note">{result.note}</p>
        </div>
      )}
    </div>
  );
}
