"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAD_SOURCES, LEAD_STATUSES, formatLeadStatus } from "@/lib/leadManagerTypes";

const phoneValid = (value: string) => /\d{8,}/.test(value.replace(/\D/g, ""));

export default function NewLeadPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const [interestedCar, setInterestedCar] = useState("");
  const [source, setSource] = useState("");
  const [cashOrFinance, setCashOrFinance] = useState("");
  const [status, setStatus] = useState("new");
  const [notes, setNotes] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!fullName.trim() || !phone.trim()) {
      setError("Full name and phone are required.");
      return;
    }

    if (!phoneValid(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/lead-manager/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          city,
          budget,
          interestedCar,
          source,
          cashOrFinance,
          status,
          notes,
          nextFollowUpDate: nextFollowUpDate || null,
          assignedTo,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setError(payload?.error || "Could not create lead.");
        setSaving(false);
        return;
      }
      router.push(`/lead-manager/leads/${payload.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create lead.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Add new lead</h2>
        <p className="text-sm text-slate-600">Capture every buyer inquiry quickly.</p>
      </div>
      <form
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={handleSubmit}
      >
        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-600">
            Full name *
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Buyer name"
              required
            />
          </label>
          <label className="text-sm text-slate-600">
            Phone *
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone number"
              required
            />
          </label>
          <label className="text-sm text-slate-600">
            City
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Jalandhar"
            />
          </label>
          <label className="text-sm text-slate-600">
            Budget
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={budget}
              onChange={(event) => setBudget(event.target.value)}
              placeholder="₹10-15 Lakh"
            />
          </label>
          <label className="text-sm text-slate-600">
            Interested car
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={interestedCar}
              onChange={(event) => setInterestedCar(event.target.value)}
              placeholder="Innova Crysta, Fortuner, etc."
            />
          </label>
          <label className="text-sm text-slate-600">
            Source
            <select
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={source}
              onChange={(event) => setSource(event.target.value)}
            >
              <option value="">Select source</option>
              {LEAD_SOURCES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-slate-600">
            Cash or finance
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={cashOrFinance}
              onChange={(event) => setCashOrFinance(event.target.value)}
              placeholder="Cash / Finance"
            />
          </label>
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
          <label className="text-sm text-slate-600">
            Assigned to
            <input
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
              value={assignedTo}
              onChange={(event) => setAssignedTo(event.target.value)}
              placeholder="Team member"
            />
          </label>
          <label className="text-sm text-slate-600 sm:col-span-2">
            Notes
            <textarea
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-slate-900 focus:outline-none"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add any extra details"
            />
          </label>
        </div>
        <button
          className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
          type="submit"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save lead"}
        </button>
      </form>
    </div>
  );
}
