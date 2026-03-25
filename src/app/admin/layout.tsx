import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { requireAdmin } from "@/lib/auth/session";
import { adminNav } from "@/lib/constants";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <AppShell
      title="Cabina di regia merchant"
      description="Gestisci il programma affiliate collegato a Shopify: store, affiliati, codici promo, link, commissioni e payout."
      navItems={adminNav}
      session={session}
    >
      {children}
    </AppShell>
  );
}
