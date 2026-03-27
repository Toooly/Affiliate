import { notFound } from "next/navigation";

import { InfluencerSettingsForm } from "@/components/forms/influencer-settings-form";
import { AutoGrid } from "@/components/shared/auto-grid";
import { MetricTile } from "@/components/shared/metric-tile";
import { SectionSplit } from "@/components/shared/section-split";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { formatUiLabel } from "@/lib/utils";

export default async function DashboardSettingsPage() {
  const session = await requireInfluencer();
  const data = await getRepository().getInfluencerSettings(session.profileId);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionSplit
        primary={
          <Card>
            <CardHeader>
              <CardTitle>Profilo e impostazioni payout</CardTitle>
              <p className="text-sm text-muted-foreground">
                Mantieni aggiornati dati di contatto, handle social e destinazione payout.
              </p>
            </CardHeader>
            <CardContent>
              <InfluencerSettingsForm initialData={data} />
            </CardContent>
          </Card>
        }
        secondary={
          <Card className="surface-affiliate">
            <CardContent className="space-y-5 p-7">
              <div className="flex items-center justify-between gap-3">
              <div className="ui-surface-overline">
                  Panoramica impostazioni
                </div>
                <StatusBadge
                  status={data.influencer.isActive ? "active" : "disabled"}
                  className="ui-surface-status"
                />
              </div>
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">
                  Tieni il tuo profilo creator pronto per i payout.
                </h2>
                <p className="mt-3 text-sm leading-7 ui-surface-copy">
                  Aggiorna dati profilo, handle social e destinazione payout per permettere al team
                  di gestire approvazioni e commissioni in modo ordinato.
                </p>
              </div>
              <AutoGrid minItemWidth="12rem">
                <MetricTile
                  label="Codice promo"
                  value={data.influencer.discountCode}
                  tone="surface"
                  valueSize="md"
                  valueType="code"
                  density="compact"
                />
                <MetricTile
                  label="Metodo payout attuale"
                  value={formatUiLabel(data.influencer.payoutMethod ?? "manual")}
                  tone="surface"
                  valueSize="sm"
                  valueType="text"
                  density="compact"
                  valueClassName="capitalize"
                />
                <MetricTile
                  label="Destinazione payout"
                  value={data.influencer.payoutEmail ?? data.profile.email}
                  tone="surface"
                  valueSize="sm"
                  valueType="url"
                  density="default"
                />
              </AutoGrid>
            </CardContent>
          </Card>
        }
        primaryClassName="xl:order-2"
        secondaryClassName="xl:order-1"
        asideWidth="20rem"
      />
    </div>
  );
}
