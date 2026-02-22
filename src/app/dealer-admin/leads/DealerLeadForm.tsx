"use client";

import { useState } from "react";

const STATUS_OPTIONS = [
  "new",
  "contacted",
  "in_progress",
  "closed",
  "won",
  "lost",
];

type Lead = {
  id: string;
  status?: string | null;
  notes?: string | null;
};

type Props = {
  lead: Lead;
};

type Status =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved" }
  | { state: "error"; message: string };

export default function DealerLeadForm({ lead }: Props) {
  const [status, setStatus] = useState(lead.status ?? "new");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [state, setState] = useState<Status>({ state: "idle" });
  const [statusTouched, setStatusTouched] = useState(false);
  const [notesTouched, setNotesTouched] = useState(false);

  const handleSave = async () => {
    const payload: Record<string, string> = {};
    if (statusTouched) payload.status = status;
    if (notesTouched) payload.notes = notes;

    if (Object.keys(payload).length === 0) {
      setState({ state: "error", message: "Nothing to update yet." });
      return;
    }

    setState({ state: "saving" });
    try {
      const res = await fetch(`/api/dealer/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({
          state: "error",
          message: data?.error ?? "Failed to update lead.",
        });
        return;
      }
      if (data?.warning) {
        setState({
          state: "error",
          message:
            "Notes or status could not be saved. Check the leads table columns.",
        });
        return;
      }
      setState({ state: "saved" });
      setTimeout(() => setState({ state: "idle" }), 2000);
    } catch {
      setState({
        state: "error",
        message: "Network error. Please try again.",
      });
    }
  };

  return (
    <div className="dealer-lead-form">
      <select
        value={status}
        onChange={(event) => {
          setStatus(event.target.value);
          setStatusTouched(true);
        }}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option.replace("_", " ")}
          </option>
        ))}
      </select>
      <textarea
        rows={2}
        placeholder="Add notes"
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value);
          setNotesTouched(true);
        }}
      />
      <button
        className="btn btn--ghost btn--tight"
        type="button"
        onClick={handleSave}
        disabled={state.state === "saving"}
      >
        {state.state === "saving" ? "Saving..." : "Save"}
      </button>
      {state.state === "saved" && (
        <span className="lead-form__success">Saved</span>
      )}
      {state.state === "error" && (
        <span className="lead-form__error">{state.message}</span>
      )}
    </div>
  );
}
