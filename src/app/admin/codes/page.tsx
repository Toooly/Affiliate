import { TicketPercent, Wallet } from "lucide-react";

import { PromoCodeAdminForm } from "@/components/forms/promo-code-admin-form";
import { PromoCodeReviewForm } from "@/components/forms/promo-code-review-form";
import { ProgramSettingsForm } from "@/components/forms/program-settings-form";
import { AutoGrid } from "@/components/shared/auto-grid";
import { CopyButton } from "@/components/shared/copy-button";
import { FilterChipLink } from "@/components/shared/filter-chip-link";
import { MetricTile } from "@/components/shared/metric-tile";
import { RecordCard, RecordCardSplit } from "@/components/shared/record-card";
import { SectionSplit } from "@/components/shared/section-split";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { buildPathWithQuery, formatCurrency } from "@/lib/utils";

type AdminCodesPageProps = {
  searchParams?: Promise<{
    status?: string;
    source?: string;
    campaign?: string;
  }>;
};

export default async function AdminCodesPage({
  searchParams,
}: AdminCodesPageProps) {
  const params = (await searchParams) ?? {};
  const [codes, affiliates, campaigns, dashboard, storeConnection] = await Promise.all([
    getRepository().listPromoCodes("all"),
    getRepository().listInfluencers(),
    getRepository().listCampaigns(),
    getRepository().getAdminOverview(),
    getRepository().getStoreConnection(),
  ]);
  const pending = codes.filter((code) => code.status === "pending");
  const filteredCodes = codes.filter((code) => {
    const matchesStatus =
      !params.status || params.status === "all" || code.status === params.status;
    const matchesSource =
      !params.source || params.source === "all" || code.source === params.source;
    const matchesCampaign =
      !params.campaign || params.campaign === "all" || code.campaignId === params.campaign;

    return matchesStatus && matchesSource && matchesCampaign;
  });
  const buildHref = (overrides: Record<string, string>) => {
    return buildPathWithQuery("/admin/codes", {
      status: params.status ?? "all",
      source: params.source ?? "all",
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
              <div className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
                Operazioni codici promo
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Assegna, approva e governa i codici promo come in un vero programma affiliate.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
                I codici sono una superficie operativa viva, non una metrica passiva. Mantieni
                chiare le regole self-serve, gestisci rapidamente le richieste in ingresso e tieni
                pulita la mappatura tra affiliati, campagne e sconti.
              </p>
            </CardContent>
          </Card>
        }
        secondary={
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Snapshot governance</CardTitle>
            </CardHeader>
            <CardContent>
              <AutoGrid minItemWidth="10rem">
                <MetricTile
                  tone="muted"
                  label="Generazione self-serve"
                  value={
                    <StatusBadge
                      status={
                        dashboard.programSettings.allowAffiliateCodeGeneration ? "active" : "disabled"
                      }
                    />
                  }
                  valueSize="sm"
                  valueType="text"
                  density="compact"
                />
                <MetricTile
                  tone="muted"
                  label="Richieste aperte"
                  value={
                    <StatusBadge
                      status={dashboard.programSettings.allowPromoCodeRequests ? "active" : "disabled"}
                    />
                  }
                  valueSize="sm"
                  valueType="text"
                  density="compact"
                />
                <MetricTile
                  tone="default"
                  label="Prefisso"
                  value={dashboard.programSettings.promoCodePrefix}
                  valueSize="md"
                  valueType="code"
                  density="compact"
                />
                <MetricTile
                  tone="default"
                  label="Coda in attesa"
                  value={pending.length}
                  valueSize="md"
                  valueType="metric"
                  density="compact"
                />
                <MetricTile
                  tone="muted"
                  label="Sync sconti Shopify"
                  value={
                    <StatusBadge
                      status={storeConnection.syncDiscountCodesEnabled ? "ready" : "not_connected"}
                    />
                  }
                  valueSize="sm"
                  valueType="text"
                  density="compact"
                />
                <MetricTile
                  tone="muted"
                  label="Match proprieta codice"
                  value={
                    <StatusBadge
                      status={
                        dashboard.programSettings.requireCodeOwnershipMatch ? "active" : "disabled"
                      }
                    />
                  }
                  valueSize="sm"
                  valueType="text"
                  density="compact"
                />
              </AutoGrid>
            </CardContent>
          </Card>
        }
        asideWidth="20rem"
      />

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={params.status ?? "all"} />
            <StatusBadge status={params.source ?? "all"} />
            <StatusBadge
              status={
                params.campaign === "all" || !params.campaign ? "all_campaigns" : params.campaign
              }
            />
            <div className="text-sm text-muted-foreground">
              {filteredCodes.length} codici visibili
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Tutti", value: "all" },
              { label: "Attivi", value: "active" },
              { label: "In revisione", value: "pending" },
              { label: "Disattivati", value: "disabled" },
              { label: "Rifiutati", value: "rejected" },
            ].map((status) => (
              <FilterChipLink key={status.value} href={buildHref({ status: status.value })}>
                {status.label}
              </FilterChipLink>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Tutte le origini", value: "all" },
              { label: "Assegnati", value: "assigned" },
              { label: "Generati", value: "generated" },
              { label: "Richiesti", value: "requested" },
            ].map((source) => (
              <FilterChipLink key={source.value} href={buildHref({ source: source.value })}>
                {source.label}
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
          label="Codici promo"
          value={String(codes.length)}
          hint={`${codes.filter((code) => code.status === "active").length} attivi`}
          icon={TicketPercent}
        />
        <StatCard
          label="Richieste in attesa"
          value={String(pending.length)}
          hint="In attesa di revisione admin"
          icon={TicketPercent}
        />
        <StatCard
          label="Default programma"
          value={`${dashboard.defaultCommissionValue}%`}
          hint={
            storeConnection.autoCreateDiscountCodes
              ? "Generazione codici pronta per Shopify"
              : "Governance sconti gestita dal merchant"
          }
          icon={Wallet}
          emphasis
        />
      </AutoGrid>

      <SectionSplit
        variant="balanced"
        primary={
          <Card>
            <CardHeader>
              <CardTitle>Regole generazione codici</CardTitle>
              <p className="text-sm text-muted-foreground">
                Decidi se gli affiliati possono creare codici in autonomia o devono chiedere
                approvazione.
              </p>
            </CardHeader>
            <CardContent>
              <ProgramSettingsForm initialValues={dashboard.programSettings} />
            </CardContent>
          </Card>
        }
        secondary={
          <Card>
            <CardHeader>
              <CardTitle>Assegna codice promo</CardTitle>
              <p className="text-sm text-muted-foreground">
                Emetti manualmente codici affiliato o campagna quando il programma richiede piu
                controllo.
              </p>
            </CardHeader>
            <CardContent>
              <PromoCodeAdminForm
                influencers={affiliates.map((affiliate) => ({
                  id: affiliate.id,
                  fullName: affiliate.fullName,
                }))}
                campaigns={campaigns.map((campaign) => ({
                  id: campaign.id,
                  name: campaign.name,
                }))}
              />
            </CardContent>
          </Card>
        }
      />

      {pending.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Richieste codice in attesa</CardTitle>
            <p className="text-sm text-muted-foreground">
              Revisiona le richieste inviate dagli affiliati e conferma il codice finale quando
              e pronto.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 xl:grid-cols-2">
            {pending.map((promoCode) => (
              <RecordCard key={promoCode.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{promoCode.influencerName}</div>
                    <div className="text-sm text-muted-foreground">{promoCode.code}</div>
                  </div>
                  <StatusBadge status={promoCode.status} />
                </div>
                <p className="ui-wrap-pretty mt-3 text-sm leading-6 text-muted-foreground">
                  {promoCode.requestMessage ?? "Nessuna nota allegata alla richiesta."}
                </p>
                <div className="mt-4">
                  <PromoCodeReviewForm promoCode={promoCode} />
                </div>
              </RecordCard>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Tutti i codici promo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Codici di programma e di campagna attualmente mappati sulla base affiliati.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredCodes.map((promoCode) => (
            <RecordCard key={promoCode.id}>
              <RecordCardSplit
              asideMinWidth="16rem"
                primary={
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{promoCode.code}</div>
                      <StatusBadge status={promoCode.status} />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {promoCode.influencerName} / {promoCode.discountValue}% di sconto / {promoCode.campaignName ?? "Intero programma"}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {promoCode.commission.toFixed(2)} di commissione / {promoCode.suspiciousEventsCount} flag di rischio
                    </div>
                  </div>
                }
                secondary={
                  <div className="ui-record-side">
                    <div className="text-sm text-muted-foreground">
                      {promoCode.conversions} conv / {formatCurrency(promoCode.revenue)} ricavi
                    </div>
                    <div className="ui-inline-actions">
                      <CopyButton value={promoCode.code} label="Codice promo" />
                      <StatusBadge status={promoCode.source} />
                    </div>
                  </div>
                }
              />
            </RecordCard>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
