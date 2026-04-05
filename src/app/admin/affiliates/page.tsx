import { AutoGrid } from "@/components/shared/auto-grid";
import { Badge } from "@/components/ui/badge";
import { FilterChipLink } from "@/components/shared/filter-chip-link";
import { MetricTile } from "@/components/shared/metric-tile";
import { Card, CardContent } from "@/components/ui/card";
import { InfluencersTable } from "@/components/tables/influencers-table";
import { getRepository } from "@/lib/data/repository";
import { buildPathWithQuery, formatCurrency, isDateWithinDays } from "@/lib/utils";

type AffiliatesPageProps = {
  searchParams?: Promise<{
    status?: string;
    platform?: string;
    country?: string;
    campaign?: string;
    performance?: string;
    activity?: string;
    search?: string;
  }>;
};

export default async function AdminAffiliatesPage({
  searchParams,
}: AffiliatesPageProps) {
  const params = (await searchParams) ?? {};
  const buildHref = (overrides: Record<string, string>) => {
    return buildPathWithQuery("/admin/affiliates", {
      status: params.status ?? "all",
      platform: params.platform ?? "all",
      country: params.country ?? "all",
      campaign: params.campaign ?? "all",
      performance: params.performance ?? "all",
      activity: params.activity ?? "all",
      search: params.search ?? "",
      ...overrides,
    });
  };
  const [allAffiliates, campaigns] = await Promise.all([
    getRepository().listInfluencers(params.search),
    getRepository().listCampaigns(),
  ]);
  const filtered = allAffiliates.filter((affiliate) => {
    const matchesStatus =
      !params.status ||
      params.status === "all" ||
      (params.status === "active" ? affiliate.isActive : !affiliate.isActive);
    const matchesPlatform =
      !params.platform ||
      params.platform === "all" ||
      affiliate.primaryPlatform === params.platform;
    const matchesCountry =
      !params.country ||
      params.country === "all" ||
      affiliate.country === params.country;
    const matchesCampaign =
      !params.campaign ||
      params.campaign === "all" ||
      campaigns.some(
        (campaign) =>
          campaign.id === params.campaign &&
          (campaign.appliesToAll || campaign.affiliateIds.includes(affiliate.id)),
      );
    const matchesPerformance =
      !params.performance ||
      params.performance === "all" ||
      (params.performance === "top"
        ? affiliate.stats.totalRevenue >= 5000
        : params.performance === "growing"
          ? affiliate.stats.totalRevenue >= 1000 && affiliate.stats.totalRevenue < 5000
          : affiliate.stats.totalRevenue < 1000);
    const matchesActivity =
      !params.activity ||
      params.activity === "all" ||
      (params.activity === "active_30d"
        ? isDateWithinDays(affiliate.lastActivityAt, 30)
        : !isDateWithinDays(affiliate.lastActivityAt, 30));

    return (
      matchesStatus &&
      matchesPlatform &&
      matchesCountry &&
      matchesCampaign &&
      matchesPerformance &&
      matchesActivity
    );
  });
  const activeCount = filtered.filter((affiliate) => affiliate.isActive).length;
  const highPerformers = filtered.filter(
    (affiliate) => affiliate.stats.totalRevenue >= 5000,
  ).length;

  return (
    <div className="ui-page-stack">
      <Card className="ui-card-hero">
        <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
              Gestione affiliati
            </div>
            <h2 className="ui-page-title mt-3">
              Cerca, segmenta e gestisci gli affiliati che stanno davvero generando crescita per lo store.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Usa questa area per aggiornare le impostazioni affiliato, leggere le performance
              e aprire subito il dettaglio operativo di ogni account affiliato.
            </p>
          </div>
          <div className="ui-hero-aside">
            <AutoGrid minItemWidth="10rem">
              <MetricTile
                label="Affiliati attivi"
                value={activeCount}
                valueSize="lg"
                valueType="metric"
                density="compact"
              />
              <MetricTile
                label="Fatturato tracciato"
                value={formatCurrency(
                  filtered.reduce((sum, affiliate) => sum + affiliate.stats.totalRevenue, 0),
                )}
                valueSize="lg"
                valueType="metric"
                density="compact"
              />
              <MetricTile
                label="Top performer"
                value={highPerformers}
                valueSize="lg"
                valueType="metric"
                density="compact"
              />
              <MetricTile
                label="Mercato selezionato"
                value={params.country ?? "Tutti i paesi"}
                valueSize="md"
                valueType="text"
                density="compact"
              />
            </AutoGrid>
          </div>
        </CardContent>
      </Card>

      <Card className="ui-card-soft ui-toolbar-card">
        <CardContent className="ui-toolbar-content lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary">Affiliati filtrati: {filtered.length}</Badge>
            <Badge variant="outline">Stato: {params.status ?? "all"}</Badge>
            <Badge variant="outline">Piattaforma: {params.platform ?? "all"}</Badge>
            <Badge variant="outline">Paese: {params.country ?? "all"}</Badge>
            <Badge variant="outline">Campagna: {params.campaign ?? "all"}</Badge>
            <Badge variant="outline">Performance: {params.performance ?? "all"}</Badge>
            <Badge variant="outline">Attivit&agrave;: {params.activity ?? "all"}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Tutti", value: "all" },
              { label: "Attivi", value: "active" },
              { label: "Inattivi", value: "inactive" },
            ].map((status) => (
              <FilterChipLink key={status.value} href={buildHref({ status: status.value })}>
                {status.label}
              </FilterChipLink>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="ui-card-soft ui-toolbar-card">
        <CardContent className="ui-toolbar-content">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Tutte le performance", value: "all" },
              { label: "Top performer", value: "top" },
              { label: "In crescita", value: "growing" },
              { label: "In fase iniziale", value: "early" },
            ].map((item) => (
              <FilterChipLink key={item.value} href={buildHref({ performance: item.value })}>
                {item.label}
              </FilterChipLink>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Tutta l'attivit\u00E0", value: "all" },
              { label: "Attivi negli ultimi 30 giorni", value: "active_30d" },
              { label: "Da riattivare", value: "inactive_30d" },
            ].map((item) => (
              <FilterChipLink key={item.value} href={buildHref({ activity: item.value })}>
                {item.label}
              </FilterChipLink>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChipLink href={buildHref({ campaign: "all" })}>
              Tutte le campagne
            </FilterChipLink>
            {campaigns.slice(0, 6).map((campaign) => (
              <FilterChipLink key={campaign.id} href={buildHref({ campaign: campaign.id })}>
                {campaign.name}
              </FilterChipLink>
            ))}
          </div>
        </CardContent>
      </Card>

      <InfluencersTable data={filtered} />
    </div>
  );
}
