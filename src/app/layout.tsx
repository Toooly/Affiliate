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
  title: "Affinity | Affiliate management per merchant",
  description:
    "Backoffice merchant e portale affiliato separati per gestire candidature, codici, tracking, commissioni e payout.",
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
