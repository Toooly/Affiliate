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
  title: "Affinity | Gestione affiliate per brand Shopify",
  description:
    "Back office merchant e portale affiliato separati per gestire candidature, codici, tracking, commissioni e pagamenti.",
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
        <Toaster
          position="top-right"
          theme="light"
          richColors
          expand
          toastOptions={{
            className:
              "rounded-[24px] border border-border-strong/72 bg-[linear-gradient(180deg,var(--layer-elevated-top),var(--layer-shell-bottom))] text-foreground shadow-[var(--shadow-dialog)]",
            descriptionClassName: "text-muted-foreground",
          }}
        />
      </body>
    </html>
  );
}
