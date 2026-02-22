"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useHydrated from "@/app/components/useHydrated";

type SavedListing = {
  id: string;
  listingId: string;
  title: string;
  price: number | null;
  location: string | null;
  photo: string | null;
  savedAt: string;
};

type SavedConfig = {
  id: string;
  listingId?: string | null;
  title: string;
  trim: string;
  color: string;
  accessories: string[];
  price: number;
  savedAt: string;
};

type Reminder = {
  id: string;
  label: string;
  dueDate: string;
};

const LISTING_KEY = "carhub:garage:listings";
const CONFIG_KEY = "carhub:garage:configs";
const REMINDER_KEY = "carhub:garage:reminders";

const formatInr = (value: number | null) =>
  value ? `₹${Math.round(value).toLocaleString("en-IN")}` : "Price on request";

const safeDate = (value?: string) => {
  try {
    return value ? new Date(value).toLocaleDateString("en-IN") : "--";
  } catch {
    return "--";
  }
};

const parseStorage = <T,>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const persist = (key: string, value: unknown) =>
  localStorage.setItem(key, JSON.stringify(value));

function MyGarageDashboardInner() {
  const [savedListings, setSavedListings] = useState<SavedListing[]>(() =>
    parseStorage<SavedListing>(LISTING_KEY)
  );
  const [savedConfigs, setSavedConfigs] = useState<SavedConfig[]>(() =>
    parseStorage<SavedConfig>(CONFIG_KEY)
  );
  const [reminders, setReminders] = useState<Reminder[]>(() =>
    parseStorage<Reminder>(REMINDER_KEY)
  );
  const [reminderLabel, setReminderLabel] = useState("");
  const [reminderDate, setReminderDate] = useState("");

  const estimatedPortfolioValue = useMemo(
    () =>
      savedListings
        .map((item) => Number(item.price ?? 0))
        .filter((value) => Number.isFinite(value) && value > 0)
        .reduce((sum, value) => sum + value, 0),
    [savedListings]
  );

  const removeListing = (id: string) => {
    const next = savedListings.filter((item) => item.id !== id);
    setSavedListings(next);
    persist(LISTING_KEY, next);
  };

  const removeConfig = (id: string) => {
    const next = savedConfigs.filter((item) => item.id !== id);
    setSavedConfigs(next);
    persist(CONFIG_KEY, next);
  };

  const addReminder = () => {
    if (!reminderLabel.trim() || !reminderDate.trim()) return;
    const next = [
      {
        id: crypto.randomUUID(),
        label: reminderLabel.trim(),
        dueDate: reminderDate,
      },
      ...reminders,
    ].slice(0, 40);
    setReminders(next);
    persist(REMINDER_KEY, next);
    setReminderLabel("");
    setReminderDate("");
  };

  const removeReminder = (id: string) => {
    const next = reminders.filter((item) => item.id !== id);
    setReminders(next);
    persist(REMINDER_KEY, next);
  };

  return (
    <div className="experience-garage">
      <div className="experience-garage__metric">
        <p>Saved cars</p>
        <strong>{savedListings.length}</strong>
      </div>
      <div className="experience-garage__metric">
        <p>Saved configurations</p>
        <strong>{savedConfigs.length}</strong>
      </div>
      <div className="experience-garage__metric">
        <p>Tracked portfolio value</p>
        <strong>{formatInr(estimatedPortfolioValue || null)}</strong>
      </div>

      <div className="experience-garage__columns">
        <section className="experience-card">
          <h3>My saved cars</h3>
          {savedListings.length === 0 ? (
            <p>No saved cars yet. Open a listing and tap &quot;Save to My Garage&quot;.</p>
          ) : (
            <ul className="experience-list">
              {savedListings.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{formatInr(item.price)} • {item.location || "Location on request"}</p>
                  </div>
                  <div className="experience-inline-actions">
                    <Link className="simple-link-btn" href={`/listing/${item.listingId}`}>
                      Open
                    </Link>
                    <button className="simple-link-btn" onClick={() => removeListing(item.id)} type="button">
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="experience-card">
          <h3>Saved builds</h3>
          {savedConfigs.length === 0 ? (
            <p>No saved builds yet. Use the configurator on any listing.</p>
          ) : (
            <ul className="experience-list">
              {savedConfigs.map((item) => (
                <li key={item.id}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>
                      {item.trim} • {item.color} • {formatInr(item.price)}
                    </p>
                  </div>
                  <button className="simple-link-btn" onClick={() => removeConfig(item.id)} type="button">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="experience-card">
        <h3>Service reminders</h3>
        <p>Set proactive reminders for servicing, insurance renewal, or battery check.</p>
        <div className="experience-builder__grid">
          <label>
            Reminder title
            <input
              value={reminderLabel}
              onChange={(event) => setReminderLabel(event.target.value)}
              placeholder="e.g., Innova service due"
            />
          </label>
          <label>
            Due date
            <input
              type="date"
              value={reminderDate}
              onChange={(event) => setReminderDate(event.target.value)}
            />
          </label>
        </div>
        <button className="simple-button simple-button--secondary" onClick={addReminder} type="button">
          Add reminder
        </button>
        {reminders.length > 0 && (
          <ul className="experience-list">
            {reminders.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.label}</strong>
                  <p>Due {safeDate(item.dueDate)}</p>
                </div>
                <button className="simple-link-btn" onClick={() => removeReminder(item.id)} type="button">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function MyGarageDashboard() {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div className="experience-garage">
        <div className="experience-garage__metric">
          <p>Saved cars</p>
          <strong>0</strong>
        </div>
        <div className="experience-garage__metric">
          <p>Saved configurations</p>
          <strong>0</strong>
        </div>
        <div className="experience-garage__metric">
          <p>Tracked portfolio value</p>
          <strong>Price on request</strong>
        </div>
      </div>
    );
  }

  return <MyGarageDashboardInner />;
}
