"use client";

import { useSyncExternalStore } from "react";
import Analytics from "@/app/components/Analytics";
import CustomerAssistantChat from "@/app/components/CustomerAssistantChat";
import MobilePublicBottomNav from "@/app/components/MobilePublicBottomNav";
import WhatsAppCTA from "@/app/components/WhatsAppCTA";

const subscribe = () => () => {};

export default function ClientEnhancements() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  if (!hydrated) return null;

  return (
    <>
      <CustomerAssistantChat />
      <WhatsAppCTA />
      <MobilePublicBottomNav />
      <Analytics />
    </>
  );
}
