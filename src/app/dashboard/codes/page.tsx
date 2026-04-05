import Link from "next/link";
import { notFound } from "next/navigation";

import { Coins, TicketPercent, Wallet } from "lucide-react";

import { PromoCodeGeneratorForm } from "@/components/forms/promo-code-generator-form";
import { AutoGrid } from "@/components/shared/auto-grid";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterChipLink } from "@/components/shared/filter-chip-link";
import { MetricTile } from "@/components/shared/metric-tile";
import { RecordCard, RecordCardSplit } from "@/components/shared/record-card";
import { SectionSplit } from "@/components/shared/section-split";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import {
  buildStorefrontShareUrl,
  getStorefrontHostLabel,
  isOperationalStoreConnection,
  selectPromoCodeForReferralLink,
} from "@/lib/storefront";
import { buildPathWithQuery, formatCurrency, formatUiLabel } from "@/lib/utils";

type DashboardCodesPageProps = {
  searchParams?: Promise<{
    status?: string;
    campaign?: string;
  }>;
};

export default async function DashboardCodesPage({
  searchParams,
}: DashboardCodesPageProps) {
  const session = await requireInfluencer();
  const params = (await searchParams) ?? {};
  const [data, storeConnection] = await Promise.all([
    getRepository().getInfluencerDashboard(session.profileId),
    getRepository().getStoreConnection(),
  ]);

  if (!data) {
    notFound();
  }

  const pendingCodes = data.promoCodes.filter((promoCode) => promoCode.status === "pending").length;
  const filteredCodes = data.promoCodes.filter((promoCode) => {
    const matchesStatus =
      !params.status || params.status === "all" || promoCode.status === params.status;
    const matchesCampaign =
      !params.campaign || params.campaign === "all" || promoCode.campaignId === params.campaign;

    return matchesStatus && matchesCampaign;
  });
  const buildHref = (overrides: Record<string, string>) => {
    return buildPathWithQuery("/dashboard/codes", {
      status: params.status ?? "all",
      campaign: params.campaign ?? "all",
      ...overrides,
    });
  };
  const primaryReferralLink =
    data.primaryReferralLink ??
    data.referralLinks.find((link) => link.isPrimary) ??
    data.referralLinks.find((link) => link.isActive) ??
    null;
  const primaryShareCode =
    (primaryReferralLink
      ? selectPromoCodeForReferralLink(primaryReferralLink, data.promoCodes)
      : null) ??
    null;
  const shopifyOperational = isOperationalStoreConnection(storeConnection);
  const primaryStorefrontShareUrl =
    primaryReferralLink && primaryShareCode && shopifyOperational
      ? buildStorefrontShareUrl({
          referralCode: primaryReferralLink.code,
          destinationUrl: primaryReferralLink.destinationUrl,
          storefrontUrl: storeConnection.storefrontUrl,
          promoCode: primaryShareCode.code,
        })
      : null;
  const storefrontHostLabel = getStorefrontHostLabel(storeConnection.storefrontUrl);

  return (
    <div className="ui-page-stack">
      <SectionSplit
        primary={
          <Card className="ui-card-hero">
            <CardContent className="p-7">
              <div className="ui-surface-overline text-primary">
                Area codici promo
              </div>
              <h2 className="ui-page-title mt-4">
                Tieni le offerte in ordine, così chi ti segue sa sempre quale codice usare al
                checkout.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                I codici promo sono uno degli strumenti di conversione più forti. Qui puoi
                generare nuovi codici, richiedere offerte dedicate per campagna e tenere sotto
                controllo cosa è attivo, in attesa o da rivedere.
              </p>
            </CardContent>
          </Card>
        }
        secondary={
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Chiarezza commissionale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetricTile
                tone="muted"
                label="Modello commissionale"
                value={`${data.influencer.commissionValue}${data.influencer.commissionType === "percentage" ? "%" : ""} ${formatUiLabel(data.influencer.commissionType)}`}
                valueSize="md"
                valueType="text"
                density="default"
              />
              <AutoGrid minItemWidth="10rem">
                <MetricTile
                  label="Commissioni in attesa"
                  value={formatCurrency(data.stats.pendingCommission)}
                  valueSize="md"
                  valueType="metric"
                  density="compact"
                />
                <MetricTile
                  label="Commissioni pagate"
                  value={formatCurrency(data.stats.paidCommission)}
                  valueSize="md"
                  valueType="metric"
                  density="compact"
                />
              </AutoGrid>
            </CardContent>
          </Card>
        }
        asideWidth="23rem"
      />

      <Card className="ui-card-soft ui-toolbar-card">
        <CardContent className="ui-toolbar-content">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={params.status ?? "all"} />
            <div className="text-sm text-muted-foreground">
              {filteredCodes.length} codici visibili
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "active", "pending", "disabled", "rejected"].map((status) => (
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
          label="Codici promo"
          value={String(data.promoCodes.length)}
          hint={`${data.promoCodes.filter((promoCode) => promoCode.status === "active").length} attivi`}
          icon={TicketPercent}
        />
        <StatCard
          label="Richieste in attesa"
          value={String(pendingCodes)}
          hint="In attesa di approvazione admin"
          icon={Coins}
        />
        <StatCard
          label="Commissioni generate"
          value={formatCurrency(data.stats.totalCommission)}
          hint="Su ordini approvati e pagati"
          icon={Wallet}
          emphasis
        />
      </AutoGrid>

      <Card>
        <CardHeader>
          <CardTitle>Crea o richiedi codici promo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Usa la generazione self-service quando disponibile oppure invia una richiesta se il
            programma richiede approvazione.
          </p>
        </CardHeader>
        <CardContent>
          <PromoCodeGeneratorForm
            allowGeneration={data.programSettings.allowAffiliateCodeGeneration}
            allowRequests={data.programSettings.allowPromoCodeRequests}
            campaigns={data.campaigns.map((campaign) => ({
              id: campaign.id,
              name: campaign.name,
            }))}
          />
        </CardContent>
      </Card>

      {primaryShareCode ? (
        <Card>
          <CardHeader>
            <CardTitle>Codice e link già coordinati</CardTitle>
            <p className="text-sm text-muted-foreground">
              {shopifyOperational
                ? `Il tuo codice principale è già pronto per essere usato anche dentro il link condivisibile verso ${storefrontHostLabel}.`
                : `Il codice è pronto lato SaaS, ma il binding automatico nel link condivisibile verso ${storefrontHostLabel} si attiverà solo dopo la connessione Shopify live.`}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Codice attivo: <span className="font-medium text-foreground">{primaryShareCode.code}</span>
            </div>
            {primaryStorefrontShareUrl ? (
              <div className="ui-wrap-anywhere text-sm text-muted-foreground">
                Link storefront coordinato: {primaryStorefrontShareUrl}
              </div>
            ) : shopifyOperational ? null : (
              <div className="text-sm text-muted-foreground">
                Completa la connessione Shopify reale per far entrare il cliente nello store con sconto già applicato.
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <CopyButton value={primaryShareCode.code} label="Codice promo" />
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/links">Apri link condivisibili</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <AutoGrid minItemWidth="23rem" gap="md">
        {filteredCodes.length ? (
          filteredCodes.map((promoCode) => (
            <RecordCard key={promoCode.id} className="h-full">
              <RecordCardSplit
                asideMinWidth="14rem"
                primary={
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="ui-card-title">{promoCode.code}</div>
                      <StatusBadge status={promoCode.status} />
                      {promoCode.isPrimary ? <StatusBadge status="primary" /> : null}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {promoCode.campaignName ?? "Valido su tutto il programma"} / {promoCode.discountValue}% di sconto
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StatusBadge status={promoCode.source} />
                      {promoCode.suspiciousEventsCount ? (
                        <StatusBadge status={`${promoCode.suspiciousEventsCount} risk`} />
                      ) : null}
                    </div>
                    {promoCode.requestMessage ? (
                      <div className="ui-wrap-pretty mt-3 text-sm text-muted-foreground">
                        {promoCode.requestMessage}
                      </div>
                    ) : null}
                  </div>
                }
                secondary={
                  <>
                    <AutoGrid minItemWidth="8rem">
                      <MetricTile
                        label="Conversioni"
                        value={String(promoCode.conversions)}
                        valueSize="sm"
                        valueType="metric"
                        density="compact"
                      />
                      <MetricTile
                        label="Fatturato"
                        value={formatCurrency(promoCode.revenue)}
                        valueSize="sm"
                        valueType="metric"
                        density="compact"
                      />
                      <MetricTile
                        label="Commissione"
                        value={formatCurrency(promoCode.commission)}
                        valueSize="sm"
                        valueType="metric"
                        density="compact"
                      />
                    </AutoGrid>
                    <div className="ui-inline-actions">
                      <CopyButton value={promoCode.code} label="Codice promo" />
                    </div>
                  </>
                }
              />
            </RecordCard>
          ))
        ) : (
          <EmptyState
            icon={TicketPercent}
            title="Nessun codice promo disponibile"
            description="I codici appariranno qui quando ne verrà generato o approvato uno reale per il tuo account."
          />
        )}
      </AutoGrid>
    </div>
  );
}
