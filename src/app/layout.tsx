import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

import { Toaster } from "sonner";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Affinity | Piattaforma Affiliate per Merchant",
  description:
    "Cabina di regia merchant e portale affiliato per operazioni affiliate pronte per Shopify.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${manrope.variable} ${mono.variable} bg-background font-sans text-foreground antialiased`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
