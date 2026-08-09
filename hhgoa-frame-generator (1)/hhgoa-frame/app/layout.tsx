import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HH Goa 2026 — Frame & ID Card Generator",
  description:
    "Turn your photo into a Hacker House Goa 2026 profile frame or builder ID card in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/*
          Loaded as literal named fonts (not next/font) on purpose:
          the canvas generator needs to reference the exact same
          font-family strings in ctx.font as the page CSS uses, and
          next/font renames families internally.
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&family=Noto+Sans+Devanagari:wght@600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
