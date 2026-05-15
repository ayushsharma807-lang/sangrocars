"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const RAW_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const DEFAULT_MESSAGE =
  process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE ??
  "Hi, I'm interested in a car listing on Sangro Cars.";

const normalizeNumber = (value: string) => value.replace(/\D/g, "");

const buildContextMessage = () => {
  if (typeof document === "undefined") return null;
  const el = document.querySelector(
    '[data-whatsapp-context="listing"]'
  ) as HTMLElement | null;
  if (!el) return null;
  const title = el.dataset.title;
  const price = el.dataset.price;
  const location = el.dataset.location;
  const url = el.dataset.url;

  const parts = [
    "Hi, I'm interested in this car listing:",
    title ? `Car: ${title}` : null,
    price ? `Price: ${price}` : null,
    location ? `Location: ${location}` : null,
    url ? `Link: ${url}` : null,
  ].filter(Boolean);

  return parts.join("\n");
};

export default function WhatsAppCTA() {
  const pathname = usePathname();
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  useEffect(() => {
    const contextMessage = buildContextMessage();
    setMessage(contextMessage ?? DEFAULT_MESSAGE);
  }, [pathname]);

  const href = useMemo(() => {
    if (!RAW_NUMBER) return "";
    const digits = normalizeNumber(RAW_NUMBER);
    if (!digits) return "";
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }, [message]);

  if (!RAW_NUMBER) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/dealer-admin")) {
    return null;
  }
  if (!href) return null;

  return (
    <a className="whatsapp-float" href={href} target="_blank" rel="noreferrer">
      WhatsApp
      <span>Chat now</span>
    </a>
  );
}
