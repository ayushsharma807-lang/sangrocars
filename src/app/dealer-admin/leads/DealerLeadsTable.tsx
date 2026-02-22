"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DealerLeadForm from "./DealerLeadForm";

type Lead = {
  id: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  listing_title?: string | null;
  status?: string | null;
  created_at?: string | null;
  message?: string | null;
  notes?: string | null;
};

type Props = {
  leads: Lead[];
};

type BulkState =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; message: string }
  | { state: "error"; message: string };

const STATUS_OPTIONS = [
  "",
  "new",
  "contacted",
  "in_progress",
  "closed",
  "won",
  "lost",
];

export default function DealerLeadsTable({ leads }: Props) {
  const [rows, setRows] = useState(leads);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkNotes, setBulkNotes] = useState("");
  const [state, setState] = useState<BulkState>({ state: "idle" });

  const ids = useMemo(() => rows.map((row) => row.id), [rows]);
  const allSelected = selectedIds.length > 0 && selectedIds.length === ids.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ids);
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkSave = async () => {
    if (selectedIds.length === 0) {
      setState({ state: "error", message: "Select at least one lead." });
      return;
    }

    const payload: Record<string, unknown> = { ids: selectedIds };
    if (bulkStatus) payload.status = bulkStatus;
    if (bulkNotes.trim()) payload.notes = bulkNotes.trim();

    if (!payload.status && !payload.notes) {
      setState({
        state: "error",
        message: "Pick a status or add notes first.",
      });
      return;
    }

    setState({ state: "saving" });
    try {
      const res = await fetch("/api/dealer/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({
          state: "error",
          message: data?.error ?? "Bulk update failed.",
        });
        return;
      }
      setRows((prev) =>
        prev.map((row) =>
          selectedIds.includes(row.id)
            ? {
                ...row,
                status: payload.status ? String(payload.status) : row.status,
                notes: payload.notes ? String(payload.notes) : row.notes,
              }
            : row
        )
      );
      setState({
        state: "saved",
        message: data?.warning
          ? "Saved with some warnings."
          : "Saved successfully.",
      });
      setSelectedIds([]);
      setBulkNotes("");
    } catch {
      setState({ state: "error", message: "Network error. Try again." });
    } finally {
      setTimeout(() => setState({ state: "idle" }), 2500);
    }
  };

  return (
    <section className="section">
      <div className="section__header">
        <div>
          <h2>Your leads</h2>
          <p>Customer enquiries from your listings.</p>
        </div>
        <div className="dealer__actions">
          <Link className="btn btn--outline" href="/api/dealer/leads/export">
            Export CSV
          </Link>
        </div>
      </div>

      <div className="dealer-bulk">
        <div className="dealer-bulk__title">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label="Select all leads"
          />
          <span>Select all</span>
        </div>
        <div className="dealer-bulk__controls">
          <select
            value={bulkStatus}
            onChange={(event) => setBulkStatus(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option ? option.replace("_", " ") : "Status (optional)"}
              </option>
            ))}
          </select>
          <textarea
            rows={2}
            placeholder="Notes for selected leads (optional)"
            value={bulkNotes}
            onChange={(event) => setBulkNotes(event.target.value)}
          />
          <button
            className="btn btn--solid btn--tight"
            type="button"
            onClick={handleBulkSave}
            disabled={state.state === "saving"}
          >
            {state.state === "saving" ? "Saving..." : "Apply to selected"}
          </button>
        </div>
        {state.state === "saved" && (
          <span className="lead-form__success">{state.message}</span>
        )}
        {state.state === "error" && (
          <span className="lead-form__error">{state.message}</span>
        )}
      </div>

      <div className="table-wrapper">
        <table className="leads-table">
          <thead>
            <tr>
              <th />
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Listing</th>
              <th>Status</th>
              <th>Created</th>
              <th>Update</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty">
                  No leads yet.
                </td>
              </tr>
            ) : (
              rows.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(lead.id)}
                      onChange={() => toggleOne(lead.id)}
                      aria-label={`Select lead ${lead.name ?? ""}`}
                    />
                  </td>
                  <td>{lead.name ?? "—"}</td>
                  <td>{lead.phone ?? "—"}</td>
                  <td>{lead.email ?? "—"}</td>
                  <td>{lead.listing_title ?? "—"}</td>
                  <td>
                    <span className="status-badge">
                      {lead.status ?? "new"}
                    </span>
                  </td>
                  <td>
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td>
                    <DealerLeadForm lead={lead} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
