"use client";

import { useState } from "react";

const STATUS_OPTIONS = ["new", "contacted", "follow_up", "closed"];

type LeadRow = {
  id: string;
  phone: string;
  status: string | null;
  notes?: string | null;
};

export default function LeadRowActions({ lead }: { lead: LeadRow }) {
  const [status, setStatus] = useState(lead.status ?? "new");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin-app/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "Could not update lead.");
      }
      setMessage("Updated");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update lead.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 1500);
    }
  };

  const phoneDigits = (lead.phone ?? "").replace(/\D/g, "");
  const whatsapp = phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <a
          href={`tel:${phoneDigits}`}
          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
        >
          Call
        </a>
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
        >
          WhatsApp
        </a>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option.replace("_", " ")}
            </option>
          ))}
        </select>
        <textarea
          className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
          rows={2}
          placeholder="Notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white"
          onClick={save}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {message ? <span className="text-xs text-slate-500">{message}</span> : null}
      </div>
    </div>
  );
}
