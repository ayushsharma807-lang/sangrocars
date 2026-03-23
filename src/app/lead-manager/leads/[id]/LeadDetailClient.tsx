"use client";

import { useState } from "react";
import { LEAD_STATUSES, formatLeadStatus } from "@/lib/leadManagerTypes";

export default function LeadDetailClient({
  id,
  initialStatus,
  initialNotes,
  initialFollowUp,
  initialAssigned,
}: {
  id: string;
  initialStatus?: string | null;
  initialNotes?: string | null;
  initialFollowUp?: string | null;
  initialAssigned?: string | null;
}) {
  const [status, setStatus] = useState(initialStatus ?? "new");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [nextFollowUpDate, setNextFollowUpDate] = useState(
    initialFollowUp ? initialFollowUp.slice(0, 10) : ""
  );
  const [assignedTo, setAssignedTo] = useState(initialAssigned ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/lead-manager/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes,
          nextFollowUpDate: nextFollowUpDate || null,
          assignedTo: assignedTo || null,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setMessage(payload?.error || "Could not update lead.");
        setSaving(false);
        return;
      }
      setMessage("Lead updated successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update lead.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Lead actions</h3>
      {message ? (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {message}
        </div>
      ) : null}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm text-slate-600">
          Status
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {LEAD_STATUSES.map((item) => (
              <option key={item} value={item}>
                {formatLeadStatus(item)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-600">
          Next follow-up date
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
            type="date"
            value={nextFollowUpDate}
            onChange={(event) => setNextFollowUpDate(event.target.value)}
          />
        </label>
        <label className="text-sm text-slate-600 sm:col-span-2">
          Assign to
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
            value={assignedTo}
            onChange={(event) => setAssignedTo(event.target.value)}
            placeholder="Team member name"
          />
        </label>
        <label className="text-sm text-slate-600 sm:col-span-2">
          Notes
          <textarea
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
            rows={5}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Add call summary or next steps"
          />
        </label>
      </div>
      <button
        className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        type="button"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  );
}
