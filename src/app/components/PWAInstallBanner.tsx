"use client";

import { useEffect, useMemo, useState } from "react";

type InstallMode = "android" | "ios";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "sangrocars_pwa_banner_dismissed_until";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    Boolean(nav.standalone)
  );
};

const isMobileViewport = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(max-width: 768px)").matches ?? false;
};

const getDismissedUntil = () => {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

const setDismissedUntil = (timestamp: number) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DISMISS_KEY, String(timestamp));
};

export default function PWAInstallBanner() {
  const [mode, setMode] = useState<InstallMode | null>(null);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosNeedsSafari, setIosNeedsSafari] = useState(false);

  const shouldShow = useMemo(
    () => visible && mode !== null && isMobileViewport(),
    [visible, mode]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissedUntil = getDismissedUntil();
    if (dismissedUntil && Date.now() < dismissedUntil) return;
    if (!isMobileViewport()) return;
    if (isStandaloneMode()) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isSafari =
      /safari/.test(ua) && !/crios|fxios|edgios|chrome|android/.test(ua);
    const isAndroid = /android/.test(ua);

    if (isIOS && isSafari) {
      setMode("ios");
      setIosNeedsSafari(false);
      setVisible(true);
    } else if (isIOS) {
      setMode("ios");
      setIosNeedsSafari(true);
      setVisible(true);
    } else if (isAndroid) {
      setMode("android");
      setVisible(true);
    } else {
      setMode("android");
      setVisible(true);
    }

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setMode("android");
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setMode(null);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (!isMobileViewport()) {
        setVisible(false);
        return;
      }
      if (mode && !isStandaloneMode()) {
        setVisible(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mode]);

  if (!shouldShow) return null;

  const title =
    mode === "android" ? "Install Sangro app" : "Add Sangro to Home Screen";
  const description =
    mode === "android"
      ? deferredPrompt
        ? "Get faster access with one tap from your home screen."
        : "Use your browser menu and tap \"Add to Home screen\"."
      : iosNeedsSafari
        ? "Open in Safari, tap Share, then \"Add to Home Screen\"."
        : "Tap the Share button, then choose \"Add to Home Screen\".";

  const handleDismiss = () => {
    setDismissedUntil(Date.now() + DISMISS_TTL_MS);
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      handleDismiss();
      return;
    }
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "dismissed") {
      setDismissedUntil(Date.now() + DISMISS_TTL_MS);
    }
    setVisible(false);
  };

  return (
    <div className="pwa-install-banner" role="status" aria-live="polite">
      <div className="pwa-install-banner__copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <div className="pwa-install-banner__actions">
        {mode === "android" ? (
          <button
            className="pwa-install-banner__button pwa-install-banner__button--primary"
            onClick={handleInstall}
            type="button"
          >
            Install
          </button>
        ) : null}
        <button
          className="pwa-install-banner__button pwa-install-banner__button--ghost"
          onClick={handleDismiss}
          type="button"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
