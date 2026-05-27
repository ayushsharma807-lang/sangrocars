"use client";

import { useSyncExternalStore } from "react";
import Analytics from "@/app/components/Analytics";
import MobilePublicBottomNav from "@/app/components/MobilePublicBottomNav";

const subscribe = () => () => {};

export default function ClientEnhancements() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  if (!hydrated) return null;

  return (
    <>
      <MobilePublicBottomNav />
      <Analytics />
    </>
  );
}
