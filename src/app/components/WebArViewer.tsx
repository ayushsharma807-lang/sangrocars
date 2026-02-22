"use client";

import type { CSSProperties, ElementType } from "react";
import { useSyncExternalStore } from "react";
import Script from "next/script";

type Props = {
  modelUrl?: string | null;
  iosModelUrl?: string | null;
  posterUrl?: string | null;
  title: string;
};

const viewerStyle: CSSProperties = {
  width: "100%",
  height: "320px",
  borderRadius: "14px",
  background: "linear-gradient(135deg, #101318, #1f2937)",
};

const subscribe = () => () => {};

export default function WebArViewer({
  modelUrl,
  iosModelUrl,
  posterUrl,
  title,
}: Props) {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);

  if (!modelUrl) {
    return (
      <div className="experience-empty">
        Add a 3D model URL (`.glb` or `.usdz`) to enable AR placement.
      </div>
    );
  }

  if (!hydrated) {
    return <div className="experience-empty">Loading 3D viewer...</div>;
  }

  const ModelViewer = "model-viewer" as ElementType;
  const props: Record<string, unknown> = {
    src: modelUrl,
    poster: posterUrl ?? undefined,
    alt: `${title} AR model`,
    ar: true,
    "ar-modes": "webxr scene-viewer quick-look",
    "camera-controls": true,
    "auto-rotate": true,
    "shadow-intensity": "1",
    style: viewerStyle,
  };

  if (iosModelUrl) {
    props["ios-src"] = iosModelUrl;
  }

  return (
    <>
      <Script
        type="module"
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
      />
      <ModelViewer {...props} />
      <p className="experience-note">
        On supported phones, tap the AR icon to place the car in your driveway.
      </p>
    </>
  );
}
