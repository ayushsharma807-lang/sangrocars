"use client";

import { useState } from "react";

type Props = {
  dealerId: string;
  hasFeed: boolean;
};

type SyncState =
  | { state: "idle" }
  | { state: "syncing" }
  | { state: "success"; message: string }
  | { state: "error"; message: string };

export default function SyncButton({ dealerId, hasFeed }: Props) {
  const [state, setState] = useState<SyncState>({ state: "idle" });

  const handleSync = async () => {
    if (!hasFeed) {
      setState({
        state: "error",
        message: "Add a feed URL or inventory website URL in Profile first.",
      });
      return;
    }
    setState({ state: "syncing" });
    try {
      const res = await fetch(`/api/sync/${dealerId}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({
          state: "error",
          message: data?.error ?? "Sync failed.",
        });
        return;
      }
      const count = data?.rows ?? 0;
      setState({
        state: "success",
        message: `Synced ${count} cars.`,
      });
      setTimeout(() => setState({ state: "idle" }), 2500);
    } catch {
      setState({ state: "error", message: "Network error. Try again." });
    }
  };

  return (
    <div className="sync-action">
      <button
        className="btn btn--outline"
        type="button"
        onClick={handleSync}
        disabled={state.state === "syncing"}
      >
        {state.state === "syncing" ? "Syncing..." : "Sync now"}
      </button>
      {state.state === "success" && (
        <span className="lead-form__success">{state.message}</span>
      )}
      {state.state === "error" && (
        <span className="lead-form__error">{state.message}</span>
      )}
    </div>
  );
}
