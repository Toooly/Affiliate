import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { influencerNav } from "@/lib/constants";
import { requireInfluencer } from "@/lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireInfluencer();

  return (
    <AppShell
      title="Portale affiliato"
      description="Crea link tracciabili, gestisci codici promo, segui le campagne e tieni pronti i dati payout."
      navItems={influencerNav}
      session={session}
    >
      {children}
    </AppShell>
  );
}
