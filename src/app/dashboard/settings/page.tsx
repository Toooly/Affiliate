import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfluencerSettingsForm } from "@/components/forms/influencer-settings-form";
import { MetricTile } from "@/components/shared/metric-tile";
import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatUiLabel } from "@/lib/utils";

export default async function DashboardSettingsPage() {
  const session = await requireInfluencer();
  const data = await getRepository().getInfluencerSettings(session.profileId);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card className="surface-affiliate">
          <CardContent className="space-y-5 p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold tracking-[0.18em] text-white/72 uppercase">
                Panoramica impostazioni
              </div>
              <StatusBadge status={data.influencer.isActive ? "active" : "disabled"} className="border-white/15 bg-white/10 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Tieni il tuo profilo creator pronto per i payout.
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/75">
                Aggiorna dati profilo, handle social e destinazione payout per permettere al team di gestire approvazioni e commissioni in modo ordinato.
              </p>
            </div>
            <div className="grid gap-3">
              <MetricTile
                label="Codice promo"
                value={data.influencer.discountCode}
                tone="surface"
                valueSize="md"
                className="min-h-[120px] p-4"
              />
              <MetricTile
                label="Metodo payout attuale"
                value={formatUiLabel(data.influencer.payoutMethod ?? "manual")}
                tone="surface"
                valueSize="sm"
                className="min-h-[120px] p-4"
                valueClassName="capitalize"
              />
              <MetricTile
                label="Destinazione payout"
                value={data.influencer.payoutEmail ?? data.profile.email}
                tone="surface"
                valueSize="sm"
                className="min-h-[132px] p-4"
                valueClassName="text-sm leading-6 break-all md:text-base"
              />
            </div>
          </CardContent>
        </Card>

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
      </section>
    </div>
  );
}
