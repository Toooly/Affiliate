import { notFound } from "next/navigation";

import { Coins, TicketPercent, Wallet } from "lucide-react";

import { PromoCodeGeneratorForm } from "@/components/forms/promo-code-generator-form";
import { AutoGrid } from "@/components/shared/auto-grid";
import { CopyButton } from "@/components/shared/copy-button";
import { FilterChipLink } from "@/components/shared/filter-chip-link";
import { MetricTile } from "@/components/shared/metric-tile";
import { RecordCard, RecordCardSplit } from "@/components/shared/record-card";
import { SectionSplit } from "@/components/shared/section-split";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
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
  const data = await getRepository().getInfluencerDashboard(session.profileId);

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

  return (
    <div className="space-y-6">
      <SectionSplit
        primary={
          <Card>
            <CardContent className="p-7">
              <div className="ui-surface-overline text-primary">
                Workspace codici promo
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Tieni le offerte in ordine, cosi chi ti segue sa sempre quale codice usare al
                checkout.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                I codici promo sono uno degli strumenti di conversione piu forti. Qui puoi
                generare nuovi codici, richiedere offerte dedicate per campagna e tenere sotto
                controllo cosa e attivo, in attesa o da rivedere.
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

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
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

      <AutoGrid minItemWidth="23rem" gap="md">
        {filteredCodes.map((promoCode) => (
          <RecordCard key={promoCode.id} className="h-full">
            <RecordCardSplit
              asideMinWidth="14rem"
              primary={
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-2xl font-semibold tracking-tight">{promoCode.code}</div>
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
        ))}
      </AutoGrid>
    </div>
  );
}
