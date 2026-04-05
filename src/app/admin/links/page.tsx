import { Link2, MousePointerClick, Wallet } from "lucide-react";

import { ReferralLinkStatusForm } from "@/components/forms/referral-link-status-form";
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
import { getRepository } from "@/lib/data/repository";
import {
  buildStorefrontShareUrl,
  isOperationalStoreConnection,
  selectPromoCodeForReferralLink,
  toStorefrontDestinationUrl,
} from "@/lib/storefront";
import { buildPathWithQuery, createPublicUrl, formatCurrency, formatPublicUrl } from "@/lib/utils";

type AdminLinksPageProps = {
  searchParams?: Promise<{
    status?: string;
    risk?: string;
    campaign?: string;
    search?: string;
  }>;
};

export default async function AdminLinksPage({
  searchParams,
}: AdminLinksPageProps) {
  const params = (await searchParams) ?? {};
  const [links, campaigns, catalogItems, promoCodes, storeConnection] = await Promise.all([
    getRepository().listReferralLinks(params.search),
    getRepository().listCampaigns(),
    getRepository().listStoreCatalogItems(),
    getRepository().listPromoCodes("all"),
    getRepository().getStoreConnection(),
  ]);
  const filteredLinks = links.filter((link) => {
    const matchesStatus =
      !params.status ||
      params.status === "all" ||
      (params.status === "active" ? link.isActive : !link.isActive);
    const matchesRisk =
      !params.risk ||
      params.risk === "all" ||
      (params.risk === "flagged"
        ? link.suspiciousEventsCount > 0
        : link.suspiciousEventsCount === 0);
    const matchesCampaign =
      !params.campaign || params.campaign === "all" || link.campaignId === params.campaign;

    return matchesStatus && matchesRisk && matchesCampaign;
  });
  const buildHref = (overrides: Record<string, string>) => {
    return buildPathWithQuery("/admin/links", {
      status: params.status ?? "all",
      risk: params.risk ?? "all",
      campaign: params.campaign ?? "all",
      search: params.search ?? "",
      ...overrides,
    });
  };
  const topLink = filteredLinks[0] ?? null;
  const shopifyOperational = isOperationalStoreConnection(storeConnection);

  return (
    <div className="ui-page-stack">
      <SectionSplit
        primary={
          <Card className="ui-card-hero">
            <CardContent className="p-7">
              <div className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                Operazioni referral link
              </div>
              <h2 className="ui-page-title mt-4">
                Controlla i link attivi, confronta le performance delle destinazioni e metti in
                pausa i routing deboli in pochi secondi.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                Qui mantieni pulita l&apos;attribuzione. I link che performano devono restare
                visibili, quelli inattivi devono essere una scelta intenzionale e il routing
                campagna deve restare coerente con asset e codici che stai spingendo davvero.
              </p>
            </CardContent>
          </Card>
        }
        secondary={
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Snapshot miglior link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topLink ? (
                <>
                  <div className="font-medium">{topLink.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {topLink.influencerName} / r/{topLink.code}
                  </div>
                  <MetricTile
                    label="Snapshot performance"
                    value={formatCurrency(topLink.revenue)}
                    hint={`${topLink.clicks} click / ${topLink.conversions} conversioni`}
                    tone="muted"
                    valueSize="md"
                    valueType="metric"
                    density="compact"
                  />
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Nessun link registrato.</div>
              )}
            </CardContent>
          </Card>
        }
        asideWidth="23rem"
      />

      <Card className="ui-card-soft ui-toolbar-card">
        <CardContent className="ui-toolbar-content">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={params.status ?? "all"} />
            <StatusBadge status={params.risk ?? "all"} />
            <div className="text-sm text-muted-foreground">{filteredLinks.length} link visibili</div>
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
            {[
              { label: "Tutto il rischio", value: "all" },
              { label: "Segnalati", value: "flagged" },
              { label: "Puliti", value: "clean" },
            ].map((risk) => (
              <FilterChipLink key={risk.value} href={buildHref({ risk: risk.value })}>
                {risk.label}
              </FilterChipLink>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChipLink href={buildHref({ campaign: "all" })}>
              Tutte le campagne
            </FilterChipLink>
            {campaigns.map((campaign) => (
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
          value={String(filteredLinks.length)}
          hint={`${filteredLinks.filter((link) => link.isActive).length} attivi`}
          icon={Link2}
        />
        <StatCard
          label="Click"
          value={String(filteredLinks.reduce((sum, link) => sum + link.clicks, 0))}
          hint="Tracciati su tutti gli affiliati"
          icon={MousePointerClick}
        />
        <StatCard
          label="Ricavi"
          value={formatCurrency(filteredLinks.reduce((sum, link) => sum + link.revenue, 0))}
          hint="Attribuiti dal routing referral"
          icon={Wallet}
          emphasis
        />
      </AutoGrid>

      <Card>
        <CardHeader>
          <CardTitle>Tutti i referral link</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mantieni attivi i link principali, monitora i link custom di campagna e ferma
            rapidamente le rotte superate.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredLinks.length ? (
            filteredLinks.map((link) => {
              const catalogItem =
                [...catalogItems]
                  .sort((left, right) => right.destinationUrl.length - left.destinationUrl.length)
                  .find((item) => link.destinationUrl.startsWith(item.destinationUrl)) ?? null;

              return (
                <RecordCard key={link.id}>
                  <RecordCardSplit
                    asideMinWidth="21rem"
                    primary={
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium">{link.name}</div>
                          <StatusBadge
                            status={link.isPrimary ? "primary" : link.isActive ? "active" : "inactive"}
                          />
                          {link.campaignName ? <StatusBadge status={link.campaignName} /> : null}
                          {catalogItem ? <StatusBadge status={catalogItem.type} /> : null}
                          {link.suspiciousEventsCount ? (
                            <StatusBadge status={`${link.suspiciousEventsCount} risk`} />
                          ) : null}
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {link.influencerName} / {link.influencerEmail}
                        </div>
                        {(() => {
                          const linkedPromoCode = selectPromoCodeForReferralLink(link, promoCodes);
                          const storefrontShareUrl = buildStorefrontShareUrl({
                            referralCode: link.code,
                            destinationUrl: link.destinationUrl,
                            storefrontUrl: storeConnection.storefrontUrl,
                            promoCode: shopifyOperational ? linkedPromoCode?.code ?? null : null,
                          });
                          const storefrontDestination = toStorefrontDestinationUrl(
                            link.destinationUrl,
                            storeConnection.storefrontUrl,
                          );

                          return (
                            <>
                              {catalogItem ? (
                                <div className="mt-1 text-sm text-muted-foreground">
                                  Destinazione Shopify: {catalogItem.title}
                                </div>
                              ) : null}
                              <div className="ui-wrap-anywhere mt-2 text-sm text-muted-foreground">
                                Link storefront: {formatPublicUrl(storefrontShareUrl)}
                              </div>
                              <div className="ui-wrap-anywhere mt-1 text-sm text-muted-foreground">
                                Link tecnico Affinity: {createPublicUrl(`/r/${link.code}`)}
                              </div>
                              <div className="ui-wrap-anywhere mt-1 text-sm text-muted-foreground">
                                Destinazione: {formatPublicUrl(storefrontDestination)}
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                {linkedPromoCode && shopifyOperational
                                  ? `Codice sconto associato: ${linkedPromoCode.code}`
                                  : linkedPromoCode
                                    ? `Codice presente nel SaaS (${linkedPromoCode.code}), ma non ancora applicabile via link finché Shopify non è operativo.`
                                    : "Nessun codice attivo associato a questo link."}
                              </div>
                              <div className="ui-inline-actions mt-4">
                                <CopyButton
                                  value={storefrontShareUrl}
                                  label="Link storefront"
                                />
                                <CopyButton
                                  value={createPublicUrl(`/r/${link.code}`)}
                                  label="Link Affinity"
                                />
                                <ReferralLinkStatusForm
                                  linkId={link.id}
                                  isActive={link.isActive}
                                  isPrimary={link.isPrimary}
                                />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    }
                    secondary={
                      <AutoGrid minItemWidth="8.5rem">
                        <MetricTile
                          label="Click"
                          value={String(link.clicks)}
                          tone="default"
                          valueSize="sm"
                          valueType="metric"
                          density="compact"
                          className="ui-mini-metric"
                        />
                        <MetricTile
                          label="Conversioni"
                          value={String(link.conversions)}
                          tone="default"
                          valueSize="sm"
                          valueType="metric"
                          density="compact"
                          className="ui-mini-metric"
                        />
                        <MetricTile
                          label="Ricavi"
                          value={formatCurrency(link.revenue)}
                          tone="default"
                          valueSize="sm"
                          valueType="metric"
                          density="compact"
                          className="ui-mini-metric"
                        />
                        <MetricTile
                          label="Commissione"
                          value={formatCurrency(link.commission)}
                          tone="default"
                          valueSize="sm"
                          valueType="metric"
                          density="compact"
                          className="ui-mini-metric"
                        />
                      </AutoGrid>
                    }
                  />
                </RecordCard>
              );
            })
          ) : (
            <EmptyState
              icon={Link2}
              title="Nessun referral link presente"
              description="Questa lista si popolerà quando verranno creati link reali dagli affiliati o dal team merchant."
              actionLabel="Apri candidature"
              actionHref="/admin/applications"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
