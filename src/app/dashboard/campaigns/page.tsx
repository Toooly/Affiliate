import { notFound } from "next/navigation";

import { Megaphone } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { MetricTile } from "@/components/shared/metric-tile";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { formatShortDate, formatUiLabel } from "@/lib/utils";

export default async function DashboardCampaignsPage() {
  const session = await requireInfluencer();
  const data = await getRepository().getInfluencerDashboard(session.profileId);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
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
            Ogni campagna dovrebbe dirti con chiarezza cosa spingere: landing page, finestre attive, asset disponibili, codici promo e referral link gia pronti.
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Campagne"
          value={String(data.campaigns.length)}
          hint={`${data.campaigns.filter((campaign) => campaign.status === "active").length} attive`}
          icon={Megaphone}
        />
        <StatCard
          label="Link campagna"
          value={String(
            data.campaigns.reduce((sum, campaign) => sum + campaign.referralLinks.length, 0),
          )}
          hint="Referral link collegati"
          icon={Megaphone}
        />
        <StatCard
          label="Asset campagna"
          value={String(
            data.campaigns.reduce((sum, campaign) => sum + campaign.assets.length, 0),
          )}
          hint="Creativita pronte all'uso"
          icon={Megaphone}
          emphasis
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Campagne attive</CardTitle>
          <p className="text-sm text-muted-foreground">
            Tutto cio che ti serve per capire cosa ogni campagna ti chiede di promuovere.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {data.campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-[28px] border border-border/70 bg-background/76 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-medium">{campaign.name}</div>
                <StatusBadge status={campaign.status} />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {campaign.description}
              </p>
                <div className="mt-4 grid auto-rows-fr gap-3 sm:grid-cols-2">
                  <MetricTile
                    label="Finestra campagna"
                    value={`${formatShortDate(campaign.startDate)} - ${formatShortDate(campaign.endDate)}`}
                    valueSize="sm"
                    className="min-h-[122px] bg-white/84"
                  />
                  <MetricTile
                    label="Regola commissionale"
                    value={
                      campaign.commissionType
                        ? `${campaign.commissionValue}${campaign.commissionType === "percentage" ? "%" : ""} ${formatUiLabel(campaign.commissionType)}`
                        : "Default programma"
                    }
                    valueSize="sm"
                    className="min-h-[122px] bg-white/84"
                  />
                  <MetricTile
                    label="Referral link"
                    value={`${campaign.referralLinks.length} link`}
                    valueSize="sm"
                    className="min-h-[110px] bg-white/84"
                  />
                  <MetricTile
                    label="Codici promo"
                    value={`${campaign.promoCodes.length} codici`}
                    valueSize="sm"
                    className="min-h-[110px] bg-white/84"
                  />
                </div>
              {campaign.rewards.length ? (
                <div className="mt-4 grid gap-2">
                  {campaign.rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="rounded-[18px] border border-border/70 bg-white/84 p-3 text-sm"
                    >
                      <div className="font-medium">{reward.title}</div>
                      <div className="mt-1 text-muted-foreground">{reward.description}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
