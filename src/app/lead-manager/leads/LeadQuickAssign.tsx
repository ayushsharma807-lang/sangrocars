"use client";

import { useState } from "react";

export default function LeadQuickAssign({
  id,
  currentAssigned,
  defaultAssignee,
}: {
  id: string;
  currentAssigned?: string | null;
  defaultAssignee: string;
}) {
  const [assignedTo, setAssignedTo] = useState(currentAssigned ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const assign = async (name: string) => {
    if (!name || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/lead-manager/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedTo: name }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setMessage(payload?.error || "Could not assign.");
        setSaving(false);
        return;
      }
      setAssignedTo(name);
      setMessage("Assigned");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not assign.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 1500);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-700">{assignedTo || "Unassigned"}</span>
      <button
        className="w-fit rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
        type="button"
        onClick={() => assign(defaultAssignee)}
        disabled={saving || assignedTo === defaultAssignee}
      >
        {assignedTo === defaultAssignee ? "Assigned to me" : "Assign to me"}
      </button>
      {message ? <span className="text-[11px] text-slate-500">{message}</span> : null}
    </div>
  );
}
