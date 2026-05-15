"use client";

import { useFormStatus } from "react-dom";

export default function NavSyncButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Syncing NAV..." : "Sync latest NAV"}
    </button>
  );
}
