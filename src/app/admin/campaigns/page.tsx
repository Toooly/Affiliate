import Link from "next/link";

import { Megaphone } from "lucide-react";

import { CampaignForm } from "@/components/forms/campaign-form";
import { AutoGrid } from "@/components/shared/auto-grid";
import { FilterChipLink } from "@/components/shared/filter-chip-link";
import { MetricTile } from "@/components/shared/metric-tile";
import { SectionSplit } from "@/components/shared/section-split";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import {
  buildPathWithQuery,
  formatCommissionRule,
  formatShortDate,
  formatUiLabel,
} from "@/lib/utils";

type AdminCampaignsPageProps = {
  searchParams?: Promise<{
    status?: string;
    assignment?: string;
  }>;
};

export default async function AdminCampaignsPage({
  searchParams,
}: AdminCampaignsPageProps) {
  const params = (await searchParams) ?? {};
  const [campaigns, dashboard, affiliates, catalogItems] = await Promise.all([
    getRepository().listCampaigns(),
    getRepository().getAdminOverview(),
    getRepository().listInfluencers(),
    getRepository().listStoreCatalogItems(),
  ]);

  const buildHref = (overrides: Record<string, string>) => {
    return buildPathWithQuery("/admin/campaigns", {
      status: params.status ?? "all",
      assignment: params.assignment ?? "all",
      ...overrides,
    });
  };

  const filtered = campaigns.filter((campaign) => {
    const matchesStatus =
      !params.status || params.status === "all" || campaign.status === params.status;
    const matchesAssignment =
      !params.assignment ||
      params.assignment === "all" ||
      (params.assignment === "all_affiliates" ? campaign.appliesToAll : !campaign.appliesToAll);

    return matchesStatus && matchesAssignment;
  });

  const activeCampaigns = campaigns.filter((campaign) => campaign.status === "active").length;
  const scheduledCampaigns = campaigns.filter((campaign) => campaign.status === "scheduled").length;
  const endedCampaigns = campaigns.filter((campaign) => campaign.status === "ended").length;

  return (
    <div className="space-y-6">
      <SectionSplit
        primary={
          <Card>
            <CardContent className="p-7">
              <div className="ui-surface-overline text-muted-foreground">
                <Megaphone className="size-4" />
                Operazioni campagne
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Gestisci le campagne come pacchetti operativi completi, non come semplici configurazioni.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                Ogni campagna deve rendere chiara l&apos;assegnazione, la destinazione landing,
                la regola commissionale, la copertura dei codici promo, gli asset disponibili e
                l&apos;eventuale reward, tutto da una sola vista merchant.
              </p>
            </CardContent>
          </Card>
        }
        secondary={
          <Card>
            <CardHeader>
              <CardTitle>Crea campagna</CardTitle>
              <p className="text-sm text-muted-foreground">
                Definisci le regole campagna per orchestrare commissioni, link, asset e reward in modo coerente.
              </p>
            </CardHeader>
            <CardContent>
              <CampaignForm
                allowedDestinations={dashboard.programSettings.allowedDestinationUrls}
                influencers={affiliates.map((affiliate) => ({
                  id: affiliate.id,
                  fullName: affiliate.fullName,
                }))}
              />
            </CardContent>
          </Card>
        }
        asideWidth="23rem"
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary">Campagne visibili: {filtered.length}</Badge>
            <Badge variant="outline">Stato: {formatUiLabel(params.status ?? "all")}</Badge>
            <Badge variant="outline">
              Assegnazione:{" "}
              {params.assignment === "all_affiliates"
                ? "assegnate a tutti"
                : params.assignment === "selected_affiliates"
                  ? "selettiva"
                  : "tutte"}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "draft", "scheduled", "active", "ended"].map((status) => (
              <FilterChipLink
                key={status}
                href={buildHref({ status })}
              >
                {formatUiLabel(status)}
              </FilterChipLink>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Tutte le assegnazioni", value: "all" },
              { label: "Assegnate a tutti", value: "all_affiliates" },
              { label: "Assegnazione selettiva", value: "selected_affiliates" },
            ].map((item) => (
              <FilterChipLink
                key={item.value}
                href={buildHref({ assignment: item.value })}
              >
                {item.label}
              </FilterChipLink>
            ))}
          </div>
        </CardContent>
      </Card>

      <AutoGrid minItemWidth="12rem" gap="md">
        <StatCard
          label="Campagne"
          value={String(filtered.length)}
          hint={`${activeCampaigns} attive in totale`}
          icon={Megaphone}
        />
        <StatCard
          label="Programmate"
          value={String(scheduledCampaigns)}
          hint="Finestre in arrivo"
          icon={Megaphone}
        />
        <StatCard
          label="Affiliati assegnati"
          value={String(filtered.reduce((sum, campaign) => sum + campaign.assignedAffiliateCount, 0))}
          hint="Copertura nel filtro corrente"
          icon={Megaphone}
        />
        <StatCard
          label="Risorse"
          value={String(filtered.reduce((sum, campaign) => sum + campaign.assetsCount + campaign.promoCodesCount, 0))}
          hint="Asset e codici promo collegati"
          icon={Megaphone}
        />
        <StatCard
          label="Concluse"
          value={String(endedCampaigns)}
          hint="Fuori finestra live"
          icon={Megaphone}
          emphasis
        />
      </AutoGrid>

      <div className="grid gap-4 xl:grid-cols-2">
        {filtered.map((campaign) => {
          const assignedAffiliates = campaign.appliesToAll
            ? affiliates.slice(0, 4)
            : affiliates
                .filter((affiliate) => campaign.affiliateIds.includes(affiliate.id))
                .slice(0, 4);
          const destination = catalogItems.find(
            (item) => item.destinationUrl === campaign.landingUrl,
          );

          return (
            <Card key={campaign.id}>
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{campaign.name}</div>
                    <div className="mt-2 text-sm text-muted-foreground">{campaign.description}</div>
                  </div>
                  <StatusBadge status={campaign.status} />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <MetricTile
                    label="Finestra campagna"
                    value={`${formatShortDate(campaign.startDate)} - ${formatShortDate(campaign.endDate)}`}
                    tone="default"
                    valueSize="sm"
                    density="compact"
                    className="ui-mini-metric"
                  />
                  <MetricTile
                    label="Regola commissionale"
                    value={formatCommissionRule(campaign.commissionType, campaign.commissionValue)}
                    tone="default"
                    valueSize="sm"
                    density="compact"
                    className="ui-mini-metric"
                  />
                  <MetricTile
                    label="Assegnazione"
                    value={
                      campaign.appliesToAll
                        ? "Tutti gli affiliati"
                        : `${campaign.assignedAffiliateCount} affiliati selezionati`
                    }
                    tone="default"
                    valueSize="sm"
                    density="compact"
                    className="ui-mini-metric"
                  />
                  <MetricTile
                    label="Risorse"
                    value={`${campaign.assetsCount} asset`}
                    hint={`${campaign.promoCodesCount} codici / ${campaign.rewardsCount} reward`}
                    tone="default"
                    valueSize="sm"
                    density="compact"
                    className="ui-mini-metric"
                  />
                </div>

                <div className="ui-surface-panel mt-4 text-sm">
                  <div className="text-muted-foreground">
                    Destinazione landing {destination ? `/ ${destination.title}` : ""}
                  </div>
                  <div className="ui-wrap-anywhere mt-2 font-medium">{campaign.landingUrl}</div>
                </div>

                <div className="mt-4">
                  <div className="ui-surface-overline text-muted-foreground">
                    Anteprima assegnazione
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {assignedAffiliates.map((affiliate) => (
                      <Badge key={affiliate.id} variant="outline">
                        {affiliate.fullName}
                      </Badge>
                    ))}
                    {!campaign.appliesToAll &&
                    campaign.assignedAffiliateCount > assignedAffiliates.length ? (
                      <Badge variant="outline">
                        +{campaign.assignedAffiliateCount - assignedAffiliates.length} altri
                      </Badge>
                    ) : null}
                  </div>
                </div>

                {campaign.bonusTitle ? (
                  <div className="ui-surface-panel mt-4 text-sm">
                    <div className="font-medium">{campaign.bonusTitle}</div>
                    <div className="mt-1 text-muted-foreground">
                      {campaign.bonusDescription ??
                        "Reward campagna collegato a questa iniziativa."}
                    </div>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href={`/admin/campaigns/${campaign.id}`}>Apri campagna</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={campaign.landingUrl} target="_blank" rel="noreferrer">
                      Apri landing
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
