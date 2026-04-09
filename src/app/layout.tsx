import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ain Pronkjewail — Samen Sterker tegen Armoede",
  description:
    "Een overzicht van alle formele en informele initiatieven tegen armoede in de provincie Groningen. Doorzoekbaar, op de kaart, en voor iedereen toegankelijk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full">
      <head>
        <link rel="stylesheet" href="/leaflet.css" />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-[#EAF7DE] text-gray-900">
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}
