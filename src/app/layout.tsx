import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientEnhancements from "@/app/components/ClientEnhancements";
import PWARegister from "@/app/components/PWARegister";

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
    default: "SangroCars | Buy Used Cars in India",
    template: "%s | SangroCars",
  },
  description:
    "Buy and sell used cars across India. Discover verified listings, connect with dealers, and post your car in minutes.",
  applicationName: "SangroCars",
  manifest: "/manifest.webmanifest",
  themeColor: "#0b0b0f",
  icons: {
    icon: "/icons/sangrocars-512.png",
    apple: "/icons/sangrocars-192.png",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    title: "SangroCars | Buy Used Cars in India",
    description:
      "Buy and sell used cars across India with verified listings and dealer support.",
    url: "/",
    siteName: "SangroCars",
    images: [
      {
        url: "/images/hero-parking.jpg",
        width: 1200,
        height: 630,
        alt: "SangroCars",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SangroCars | Buy Used Cars in India",
    description:
      "Buy and sell used cars across India with verified listings and dealer support.",
    images: ["/images/hero-parking.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId =
    process.env.NEXT_PUBLIC_GA_ID ?? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${gaId}');`}
            </Script>
          </>
        ) : null}
        {clarityId ? (
          <Script id="clarity-init" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${clarityId}");`}
          </Script>
        ) : null}
        <PWARegister />
        <ClientEnhancements />
      </body>
    </html>
  );
}
