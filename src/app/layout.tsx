import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientEnhancements from "@/app/components/ClientEnhancements";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: (() => {
    try {
      return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000");
    } catch {
      return new URL("http://localhost:3000");
    }
  })(),
  title: {
    default: "CarHub India | Exclusive Cars & Dealer Listings",
    template: "%s | CarHub India",
  },
  description:
    "Discover exclusive weekly car deals and dealer listings across India. Compare verified inventory, connect with dealers, and close faster.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "CarHub India | Exclusive Cars & Dealer Listings",
    description:
      "Discover exclusive weekly car deals and dealer listings across India.",
    url: "/",
    siteName: "CarHub India",
    images: [
      {
        url: "/images/hero-parking.jpg",
        width: 1200,
        height: 630,
        alt: "CarHub India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CarHub India | Exclusive Cars & Dealer Listings",
    description:
      "Discover exclusive weekly car deals and dealer listings across India.",
    images: ["/images/hero-parking.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <ClientEnhancements />
      </body>
    </html>
  );
}
