"use client";

import { useSyncExternalStore } from "react";
import Analytics from "@/app/components/Analytics";
import CustomerAssistantChat from "@/app/components/CustomerAssistantChat";

const subscribe = () => () => {};

export default function ClientEnhancements() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  if (!hydrated) return null;

  return (
    <>
      <CustomerAssistantChat />
      <Analytics />
    </>
  );
}
