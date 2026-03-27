import { notFound } from "next/navigation";

import { Megaphone } from "lucide-react";

import { AutoGrid } from "@/components/shared/auto-grid";
import { StatusBadge } from "@/components/shared/status-badge";
import { MetricTile } from "@/components/shared/metric-tile";
import { RecordCard } from "@/components/shared/record-card";
import { SectionSplit } from "@/components/shared/section-split";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { formatCommissionRule, formatShortDate } from "@/lib/utils";

export default async function DashboardCampaignsPage() {
  const session = await requireInfluencer();
  const data = await getRepository().getInfluencerDashboard(session.profileId);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionSplit
        primary={
          <Card>
            <CardContent className="p-7">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                <Megaphone className="size-4" />
                Hub campagne
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Scopri quali campagne puoi promuovere e cosa include ciascuna.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                Ogni campagna dovrebbe dirti con chiarezza cosa spingere: landing page, finestre
                attive, asset disponibili, codici promo e referral link gia pronti.
              </p>
            </CardContent>
          </Card>
        }
        secondary={
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Snapshot campagne</CardTitle>
            </CardHeader>
            <CardContent>
              <AutoGrid minItemWidth="9.5rem">
                <MetricTile
                  label="Campagne"
                  value={String(data.campaigns.length)}
                  hint={`${data.campaigns.filter((campaign) => campaign.status === "active").length} attive`}
                  valueType="metric"
                  density="compact"
                />
                <MetricTile
                  label="Link campagna"
                  value={String(
                    data.campaigns.reduce((sum, campaign) => sum + campaign.referralLinks.length, 0),
                  )}
                  hint="Referral link collegati"
                  valueType="metric"
                  density="compact"
                />
                <MetricTile
                  label="Asset campagna"
                  value={String(
                    data.campaigns.reduce((sum, campaign) => sum + campaign.assets.length, 0),
                  )}
                  hint="Creativita pronte all'uso"
                  valueType="metric"
                  density="compact"
                />
              </AutoGrid>
            </CardContent>
          </Card>
        }
        asideWidth="22rem"
      />

      <Card>
        <CardHeader>
          <CardTitle>Campagne attive</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tutto cio che ti serve per capire cosa ogni campagna ti chiede di promuovere.
          </p>
        </CardHeader>
        <CardContent>
          <AutoGrid minItemWidth="19rem" gap="md">
            {data.campaigns.map((campaign) => (
              <RecordCard key={campaign.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-medium">{campaign.name}</div>
                  <StatusBadge status={campaign.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {campaign.description}
                </p>
                <AutoGrid minItemWidth="9rem" className="mt-4">
                  <MetricTile
                    label="Finestra campagna"
                    value={`${formatShortDate(campaign.startDate)} - ${formatShortDate(campaign.endDate)}`}
                    valueSize="sm"
                    valueType="text"
                    density="compact"
                  />
                  <MetricTile
                    label="Regola commissionale"
                    value={formatCommissionRule(campaign.commissionType, campaign.commissionValue)}
                    valueSize="sm"
                    valueType="text"
                    density="compact"
                  />
                  <MetricTile
                    label="Referral link"
                    value={`${campaign.referralLinks.length} link`}
                    valueSize="sm"
                    valueType="metric"
                    density="compact"
                  />
                  <MetricTile
                    label="Codici promo"
                    value={`${campaign.promoCodes.length} codici`}
                    valueSize="sm"
                    valueType="metric"
                    density="compact"
                  />
                </AutoGrid>
                {campaign.rewards.length ? (
                  <div className="mt-4 grid gap-2">
                    {campaign.rewards.map((reward) => (
                      <div key={reward.id} className="ui-panel-elevated p-3 text-sm">
                        <div className="font-medium">{reward.title}</div>
                        <div className="mt-1 text-muted-foreground">{reward.description}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </RecordCard>
            ))}
          </AutoGrid>
        </CardContent>
      </Card>
    </div>
  );
}
