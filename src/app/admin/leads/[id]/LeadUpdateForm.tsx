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

type Props = {
  leadId: string;
  initialStatus: string | null;
  initialNotes: string | null;
  initialAssignedTo: string | null;
  staffOptions: { id: string; name: string }[];
};

type Status =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved" }
  | { state: "error"; message: string };

export default function LeadUpdateForm({
  leadId,
  initialStatus,
  initialNotes,
  initialAssignedTo,
  staffOptions,
}: Props) {
  const options =
    initialStatus && !STATUS_OPTIONS.includes(initialStatus)
      ? [initialStatus, ...STATUS_OPTIONS]
      : STATUS_OPTIONS;
  const [status, setStatus] = useState(initialStatus ?? "new");
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [assignedTo, setAssignedTo] = useState(initialAssignedTo ?? "");
  const [state, setState] = useState<Status>({ state: "idle" });

  const handleSave = async () => {
    setState({ state: "saving" });
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes,
          assigned_to: assignedTo || null,
        }),
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
        const warningText = String(data.warning);
        let message = "Some fields could not be saved.";
        if (warningText.includes("notes_not_saved")) {
          message = "Notes could not be saved. Add a notes column to the leads table.";
        } else if (warningText.includes("status_not_saved")) {
          message = "Status could not be saved. Add a status column to the leads table.";
        } else if (warningText.includes("assigned_not_saved")) {
          message =
            "Assignment could not be saved. Add an assigned_to column to the leads table.";
        }
        setState({
          state: "error",
          message,
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
    <div className="lead-update">
      <label>
        Status
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option.replace("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <label>
        Assigned to
        <select
          value={assignedTo}
          onChange={(event) => setAssignedTo(event.target.value)}
        >
          <option value="">Unassigned</option>
          {staffOptions.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Notes
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Add notes, follow-up details, or next steps"
          rows={4}
        />
      </label>
      <button
        className="btn btn--solid"
        onClick={handleSave}
        disabled={state.state === "saving"}
        type="button"
      >
        {state.state === "saving" ? "Saving..." : "Save updates"}
      </button>
      {state.state === "saved" && (
        <p className="lead-form__success">Lead updated.</p>
      )}
      {state.state === "error" && (
        <p className="lead-form__error">{state.message}</p>
      )}
    </div>
  );
}
