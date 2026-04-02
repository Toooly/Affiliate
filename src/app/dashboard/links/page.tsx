import { notFound } from "next/navigation";

import { Link2, MousePointerClick, Wallet } from "lucide-react";

import { ArchiveReferralLinkButton } from "@/components/forms/archive-referral-link-button";
import { ReferralLinkForm } from "@/components/forms/referral-link-form";
import { AutoGrid } from "@/components/shared/auto-grid";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterChipLink } from "@/components/shared/filter-chip-link";
import { MetricTile } from "@/components/shared/metric-tile";
import { RecordCard, RecordCardSplit } from "@/components/shared/record-card";
import { SectionSplit } from "@/components/shared/section-split";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import {
  buildPathWithQuery,
  createPublicUrl,
  formatCurrency,
  formatPublicUrl,
  formatUiLabel,
  timeAgo,
} from "@/lib/utils";

type DashboardLinksPageProps = {
  searchParams?: Promise<{
    status?: string;
    campaign?: string;
  }>;
};

export default async function DashboardLinksPage({
  searchParams,
}: DashboardLinksPageProps) {
  const session = await requireInfluencer();
  const params = (await searchParams) ?? {};
  const data = await getRepository().getInfluencerDashboard(session.profileId);

  if (!data) {
    notFound();
  }

  const filteredLinks = data.referralLinks.filter((link) => {
    const matchesStatus =
      !params.status ||
      params.status === "all" ||
      (params.status === "active" ? link.isActive : !link.isActive);
    const matchesCampaign =
      !params.campaign || params.campaign === "all" || link.campaignId === params.campaign;

    return matchesStatus && matchesCampaign;
  });
  const buildHref = (overrides: Record<string, string>) => {
    return buildPathWithQuery("/dashboard/links", {
      status: params.status ?? "all",
      campaign: params.campaign ?? "all",
      ...overrides,
    });
  };

  return (
    <div className="space-y-6">
      <SectionSplit
        primary={
          <Card>
            <CardContent className="p-6">
              <div className="ui-surface-overline text-primary">
                Workspace referral link
              </div>
              <h2 className="ui-page-title mt-4">
                Crea link tracciati per prodotti, campagne e formati contenuto.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
                Usa nomi chiari per capire subito quale angolo creativo, landing page o
                destinazione campagna converte meglio. Aggiungi parametri UTM quando vuoi
                report piu puliti nei dati del tuo store.
              </p>
            </CardContent>
          </Card>
        }
        secondary={
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Linee guida link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <div className="ui-soft-block">
                Dai ai link un nome basato sull&apos;intento del contenuto, non solo sulla
                destinazione.
              </div>
              <div className="ui-soft-block">
                Collega il link a una campagna quando la landing fa parte di una promozione attiva.
              </div>
              <div className="ui-soft-block">
                Aggiungi parametri UTM se vuoi confrontare traffico da stories, reel, email o bio.
              </div>
            </CardContent>
          </Card>
        }
        asideWidth="20rem"
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={params.status ?? "all"} />
            <div className="text-sm text-muted-foreground">{filteredLinks.length} link visibili</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "active", "inactive"].map((status) => (
              <FilterChipLink key={status} href={buildHref({ status })}>
                {formatUiLabel(status)}
              </FilterChipLink>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChipLink href={buildHref({ campaign: "all" })}>
              Tutte le campagne
            </FilterChipLink>
            {data.campaigns.map((campaign) => (
              <FilterChipLink key={campaign.id} href={buildHref({ campaign: campaign.id })}>
                {campaign.name}
              </FilterChipLink>
            ))}
          </div>
        </CardContent>
      </Card>

      <AutoGrid minItemWidth="12rem" gap="md">
        <StatCard
          label="Link"
          value={String(data.referralLinks.length)}
          hint={`${data.referralLinks.filter((link) => link.isActive).length} attivi`}
          icon={Link2}
        />
        <StatCard
          label="Click"
          value={String(data.referralLinks.reduce((sum, link) => sum + link.clicks, 0))}
          hint="Su tutti i tuoi link"
          icon={MousePointerClick}
        />
        <StatCard
          label="Fatturato"
          value={formatCurrency(data.referralLinks.reduce((sum, link) => sum + link.revenue, 0))}
          hint="Attribuito dai link"
          icon={Wallet}
          emphasis
        />
      </AutoGrid>

      <Card>
        <CardHeader>
          <CardTitle>Crea un nuovo referral link</CardTitle>
        </CardHeader>
        <CardContent>
          <ReferralLinkForm
            allowedDestinations={data.programSettings.allowedDestinationUrls}
            campaigns={data.campaigns.map((campaign) => ({
              id: campaign.id,
              name: campaign.name,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>I tuoi link operativi</CardTitle>
          <p className="text-sm text-muted-foreground">
            Il link deve essere subito leggibile, il contesto campagna chiaro e la performance
            facile da confrontare.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredLinks.length ? (
            filteredLinks.map((link) => (
              <RecordCard key={link.id}>
                <RecordCardSplit
                  asideMinWidth="18rem"
                  primary={
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{link.name}</div>
                        <StatusBadge
                          status={link.isPrimary ? "primary" : link.isActive ? "active" : "inactive"}
                        />
                        {link.campaignName ? <StatusBadge status={link.campaignName} /> : null}
                      </div>
                      <div className="ui-wrap-anywhere mt-2 text-sm text-muted-foreground">
                        URL da condividere: {createPublicUrl(`/r/${link.code}`)}
                      </div>
                      <div className="ui-wrap-anywhere mt-1 text-sm text-muted-foreground">
                        Destinazione: {formatPublicUrl(link.destinationUrl)}
                      </div>
                      {link.utmSource || link.utmMedium || link.utmCampaign ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {link.utmSource ? <StatusBadge status={`utm:${link.utmSource}`} /> : null}
                          {link.utmMedium ? <StatusBadge status={`medium:${link.utmMedium}`} /> : null}
                          {link.utmCampaign ? (
                            <StatusBadge status={`campaign:${link.utmCampaign}`} />
                          ) : null}
                        </div>
                      ) : null}
                      <div className="ui-meta-line mt-3 text-xs">
                        <span>
                          {link.lastClickAt
                            ? `Ultimo click tracciato ${timeAgo(link.lastClickAt)}`
                            : "Nessun click tracciato al momento"}
                        </span>
                        {link.suspiciousEventsCount ? (
                          <span>{link.suspiciousEventsCount} flag rischio</span>
                        ) : null}
                      </div>
                    </div>
                  }
                  secondary={
                    <>
                      <AutoGrid minItemWidth="9rem">
                        <MetricTile
                          label="Click"
                          value={String(link.clicks)}
                          tone="default"
                          valueSize="sm"
                          valueType="metric"
                          density="compact"
                        />
                        <MetricTile
                          label="Conversioni"
                          value={String(link.conversions)}
                          tone="default"
                          valueSize="sm"
                          valueType="metric"
                          density="compact"
                        />
                        <MetricTile
                          label="Fatturato"
                          value={formatCurrency(link.revenue)}
                          tone="default"
                          valueSize="sm"
                          valueType="metric"
                          density="compact"
                        />
                      </AutoGrid>
                      <div className="ui-panel-block ui-panel-block-strong flex min-w-0 flex-col gap-3">
                        <CopyButton
                          value={createPublicUrl(`/r/${link.code}`)}
                          label="Link da condividere"
                        />
                        {!link.isPrimary ? (
                          <ArchiveReferralLinkButton linkId={link.id} disabled={!link.isActive} />
                        ) : null}
                      </div>
                    </>
                  }
                />
              </RecordCard>
            ))
          ) : (
            <EmptyState
              icon={Link2}
              title="Nessun referral link creato"
              description="Il tuo primo link apparira qui solo dopo la creazione reale di una destinazione condivisibile."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
