import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sangro",
    short_name: "Sangro",
    description:
      "Sangro services dashboard for cars, wealth, finance, insurance, and properties.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#0b0b0f",
    background_color: "#0b0b0f",
    icons: [
      {
        src: "/icons/sangrocars-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/sangrocars-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/sangrocars-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
