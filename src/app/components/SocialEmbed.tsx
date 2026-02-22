"use client";

import { useEffect } from "react";

type Props = {
  embedCode: string;
};

declare global {
  interface Window {
    instgrm?: { Embeds?: { process: () => void } };
    FB?: { XFBML?: { parse: () => void } };
    __instagramEmbedLoaded?: boolean;
    __facebookEmbedLoaded?: boolean;
  }
}

const loadScript = (src: string, id: string) =>
  new Promise<void>((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.id = id;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Script load failed"));
    document.body.appendChild(script);
  });

export default function SocialEmbed({ embedCode }: Props) {
  useEffect(() => {
    const lower = embedCode.toLowerCase();
    const needsInstagram = lower.includes("instagram.com") || lower.includes("instagram-media");
    const needsFacebook =
      lower.includes("facebook.com") || lower.includes("fb-video") || lower.includes("fb-post");

    const ensureFbRoot = () => {
      if (!document.getElementById("fb-root")) {
        const root = document.createElement("div");
        root.id = "fb-root";
        document.body.appendChild(root);
      }
    };

    const runInstagram = async () => {
      if (window.__instagramEmbedLoaded) {
        window.instgrm?.Embeds?.process?.();
        return;
      }
      try {
        await loadScript("https://www.instagram.com/embed.js", "instagram-embed-js");
        window.__instagramEmbedLoaded = true;
        window.instgrm?.Embeds?.process?.();
      } catch {
        // ignore
      }
    };

    const runFacebook = async () => {
      if (window.__facebookEmbedLoaded) {
        window.FB?.XFBML?.parse?.();
        return;
      }
      try {
        ensureFbRoot();
        await loadScript(
          "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0",
          "facebook-embed-js"
        );
        window.__facebookEmbedLoaded = true;
        window.FB?.XFBML?.parse?.();
      } catch {
        // ignore
      }
    };

    if (needsInstagram) {
      void runInstagram();
    }
    if (needsFacebook) {
      void runFacebook();
    }
  }, [embedCode]);

  return (
    <div
      className="social-embed"
      dangerouslySetInnerHTML={{ __html: embedCode }}
    />
  );
}
