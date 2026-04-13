"use client";

import { useState } from "react";

type Props = {
  listingId: string;
  caption: string;
  imageUrl: string | null;
  listingUrl: string;
  status?: string | null;
  postedAt?: string | null;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function InstagramComposer({
  listingId,
  caption,
  imageUrl,
  listingUrl,
  status,
  postedAt,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setMessage("Copy failed. Please select and copy manually.");
    }
  };

  const updateStatus = async (nextStatus: "ready" | "posted") => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/instagram/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, caption }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setMessage(payload?.error || "Could not update Instagram status.");
        setSaving(false);
        return;
      }
      setMessage(
        nextStatus === "posted"
          ? "Marked as posted."
          : "Saved as ready to post."
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update Instagram status."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-instagram">
      <div className="admin-instagram__grid">
        <div className="admin-instagram__preview">
          {imageUrl ? (
            <img src={imageUrl} alt="Listing" />
          ) : (
            <div className="admin-instagram__placeholder">
              No image available
            </div>
          )}
          <div className="admin-instagram__meta">
            <p>
              <strong>Status:</strong> {status || "not_set"}
            </p>
            {postedAt ? (
              <p>
                <strong>Posted:</strong> {formatDateTime(postedAt)}
              </p>
            ) : null}
          </div>
        </div>
        <div className="admin-instagram__content">
          <label>
            Caption
            <textarea value={caption} readOnly rows={10} />
          </label>
          <div className="admin-instagram__actions">
            <button
              type="button"
              className="btn btn--outline"
              onClick={copyCaption}
            >
              {copied ? "Copied!" : "Copy caption"}
            </button>
            <a
              className="btn btn--outline"
              href="https://business.facebook.com/latest/composer"
              target="_blank"
              rel="noreferrer"
            >
              Open Business Suite
            </a>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => updateStatus("ready")}
              disabled={saving}
            >
              Save as ready
            </button>
            <button
              type="button"
              className="btn btn--solid"
              onClick={() => updateStatus("posted")}
              disabled={saving}
            >
              Mark as posted
            </button>
          </div>
          {message ? <p className="admin-banner">{message}</p> : null}
          <p className="admin-instagram__hint">
            View listing: <a href={listingUrl}>{listingUrl}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
