"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PWARegister() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const clearRegistrations = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => key.startsWith("sangrocars-"))
            .map((key) => caches.delete(key))
        );
      } catch (error) {
        console.warn("PWA cleanup failed", error);
      }
    };

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await registration.update();
      } catch (error) {
        console.warn("PWA registration failed", error);
      }
    };

    if (pathname?.startsWith("/admin") || pathname?.startsWith("/dealer-admin")) {
      clearRegistrations();
      return;
    }

    register();
  }, [pathname]);

  return null;
}
