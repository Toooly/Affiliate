import Link from "next/link";

import {
  AlertTriangle,
  ExternalLink,
  RefreshCcw,
  ShieldCheck,
  Store,
  Waypoints,
  Webhook,
} from "lucide-react";

import { RetryStoreSyncJobButton } from "@/components/forms/retry-store-sync-job-button";
import { RetryWebhookIngestionButton } from "@/components/forms/retry-webhook-ingestion-button";
import { StoreCatalogRulesForm } from "@/components/forms/store-catalog-rules-form";
import { StoreConnectionForm } from "@/components/forms/store-connection-form";
import { StoreSyncJobForm } from "@/components/forms/store-sync-job-form";
import { StoreWebhookIntakeForm } from "@/components/forms/store-webhook-intake-form";
import { MetricTile } from "@/components/shared/metric-tile";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SHOPIFY_SCOPE_OPTIONS } from "@/lib/constants";
import { getRepository } from "@/lib/data/repository";
import { isDemoMode, isShopifyConfigured } from "@/lib/env";
import { evaluateStoreConnectionHealth } from "@/lib/shopify";
import { formatCurrency, formatShortDate, formatUiLabel } from "@/lib/utils";

function formatSyncTypeLabel(type: string) {
  const map: Record<string, string> = {
    products: "Prodotti",
    collections: "Collection",
    pages: "Pagine",
    discounts: "Sconti",
    orders: "Ordini",
    attribution: "Attribuzione",
  };

  return map[type] ?? formatUiLabel(type);
}

function formatModeLabel(mode: string) {
  const map: Record<string, string> = {
    incremental: "Incrementale",
    full: "Completa",
    retry: "Riprova",
  };

  return map[mode] ?? formatUiLabel(mode);
}

function formatSourceLabel(source: string) {
  const map: Record<string, string> = {
    shopify: "Shopify",
    hybrid: "Ibrido",
    manual: "Manuale",
    webhook: "Webhook",
  };

  return map[source] ?? formatUiLabel(source);
}

type AdminStorePageProps = {
  searchParams?: Promise<{
    shopify?: string;
  }>;
};

export default async function AdminStorePage({
  searchParams,
}: AdminStorePageProps) {
  const params = (await searchParams) ?? {};
  const [
    storeConnection,
    links,
    campaigns,
    codes,
    conversions,
    catalogItems,
    syncJobs,
    webhookRecords,
  ] = await Promise.all([
    getRepository().getStoreConnection(),
    getRepository().listReferralLinks(),
    getRepository().listCampaigns(),
    getRepository().listPromoCodes("all"),
    getRepository().listConversions(),
    getRepository().listStoreCatalogItems(),
    getRepository().listStoreSyncJobs(),
    getRepository().listWebhookIngestionRecords("all"),
  ]);

  const health = evaluateStoreConnectionHealth(storeConnection, syncJobs, webhookRecords);
  const failedJobs = syncJobs.filter(
    (job) => job.status === "failed" || job.status === "partial",
  );
  const failedWebhooks = webhookRecords.filter((record) => record.status === "failed");
  const processedWebhooks = webhookRecords.filter(
    (record) => record.status === "processed",
  );
  const storeAttributedConversions = conversions.filter(
    (conversion) => conversion.attributionSource !== "manual",
  );
  const storeUsage = catalogItems.map((item) => {
    const linkedCampaigns = campaigns.filter(
      (campaign) => campaign.landingUrl === item.destinationUrl,
    );
    const linkedLinks = links.filter((link) =>
      link.destinationUrl.startsWith(item.destinationUrl),
    );
    const linkedCodes = codes.filter((code) =>
      linkedCampaigns.some((campaign) => campaign.id === code.campaignId),
    );

    return {
      ...item,
      linkedCampaigns,
      linkedLinks,
      linkedCodes,
      linkedRevenue: conversions
        .filter((conversion) =>
          linkedCampaigns.some((campaign) => campaign.name === conversion.campaignName),
        )
        .reduce((sum, conversion) => sum + conversion.orderAmount, 0),
    };
  });
  const lastSuccessfulSync =
    syncJobs.find((job) => job.status === "succeeded" || job.status === "partial") ?? null;
  const liveBridgeEnabled = !isDemoMode() && isShopifyConfigured();
  const shopifyCallbackMessage =
    params.shopify === "connected"
      ? "Shopify e stato collegato e il primo sync catalogo live e partito."
      : params.shopify === "connected_with_sync_issue"
        ? "Shopify e stato collegato, ma il primo sync live richiede una verifica."
        : params.shopify === "invalid_hmac"
          ? "La firma della callback Shopify non e stata verificata."
          : params.shopify === "invalid_state"
            ? "Lo stato della callback Shopify non coincide con la sessione di installazione."
            : params.shopify === "bridge_not_configured"
              ? "Mancano le env vars del bridge Shopify, quindi l&apos;installazione live non puo partire."
              : null;
  const sourceOfTruth = [
    {
      label: "Destinazioni catalogo",
      source: "shopify",
      freshness: storeConnection.lastProductsSyncAt,
      detail: `${storeConnection.productsSyncedCount} prodotti e ${storeConnection.collectionsSyncedCount} collection pronti per il routing affiliate.`,
    },
    {
      label: "Codici sconto",
      source: "hybrid",
      freshness: storeConnection.lastDiscountSyncAt,
      detail: `${storeConnection.discountsSyncedCount} sconti sincronizzati e allineati alla governance promo del merchant.`,
    },
    {
      label: "Ordini e conversioni",
      source: "shopify",
      freshness: storeConnection.lastOrdersSyncAt,
      detail: `${storeAttributedConversions.length} conversioni attribuite stanno gia leggendo attivita generate dallo store.`,
    },
    {
      label: "Input di attribuzione",
      source: "hybrid",
      freshness: storeConnection.lastWebhookAt,
      detail: "Referral link, proprieta coupon e webhook in ingresso collaborano per assegnare il merito corretto.",
    },
  ];

  return (
    <div className="space-y-6">
      {shopifyCallbackMessage ? (
        <Card>
          <CardContent className="p-4 text-sm">{shopifyCallbackMessage}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              <Store className="size-4" />
              Operazioni store Shopify
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Gestisci installazione, sync e salute webhook dello store Shopify collegato al programma affiliate.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Questo hub merchant mostra se l&apos;installazione Shopify e sana,
              se i dati sono aggiornati, quali sync hanno fallito e se le
              conversioni guidate dallo store stanno alimentando correttamente il ledger commissionale.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/admin">Apri cabina di regia</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/conversions">Apri ledger commissioni</Link>
            </Button>
            {liveBridgeEnabled ? (
              <Button asChild variant="outline">
                <Link href={`/api/shopify/install?shop=${encodeURIComponent(storeConnection.shopDomain)}`}>
                  {storeConnection.installState === "installed" ? "Ricollega Shopify" : "Collega Shopify"}
                </Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Stato installazione"
          value={formatUiLabel(storeConnection.installState)}
          hint={storeConnection.shopDomain}
          icon={Store}
          emphasis
        />
        <StatCard
          label="Salute connessione"
          value={formatUiLabel(storeConnection.connectionHealth)}
          hint={
            storeConnection.lastHealthCheckAt
              ? `Verificata il ${formatShortDate(storeConnection.lastHealthCheckAt)}`
              : "Nessun controllo registrato"
          }
          icon={ShieldCheck}
        />
        <StatCard
          label="Sync falliti"
          value={String(failedJobs.length)}
          hint={
            lastSuccessfulSync
              ? `Ultima esecuzione utile ${formatShortDate(lastSuccessfulSync.completedAt ?? lastSuccessfulSync.createdAt)}`
              : "Nessun sync riuscito"
          }
          icon={RefreshCcw}
        />
        <StatCard
          label="Webhook falliti"
          value={String(failedWebhooks.length)}
          hint={`${processedWebhooks.length} eventi processati`}
          icon={Webhook}
        />
        <StatCard
          label="Ricavi attribuiti allo store"
          value={formatCurrency(
            storeAttributedConversions.reduce(
              (sum, conversion) => sum + conversion.orderAmount,
              0,
            ),
          )}
          hint={`${storeAttributedConversions.length} conversioni`}
          icon={Waypoints}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Impostazioni connessione store</CardTitle>
            <p className="text-sm text-muted-foreground">
              Gestisci stato installazione, dominio Shopify, readiness app e scope concessi da un&apos;unica superficie merchant.
            </p>
          </CardHeader>
          <CardContent>
            <StoreConnectionForm initialValues={storeConnection} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Readiness installazione</CardTitle>
            <p className="text-sm text-muted-foreground">
              Il merchant deve capire subito se installazione, permessi, tracking e sync sono abbastanza affidabili da sostenere il programma.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-border/70 bg-background/78 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={storeConnection.installState} />
                <StatusBadge status={storeConnection.status} />
                <StatusBadge status={storeConnection.connectionHealth} />
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                {storeConnection.lastHealthError ??
                  "Non sono stati rilevati problemi bloccanti di installazione o connessione."}
              </div>
              {!liveBridgeEnabled ? (
                <div className="mt-3 text-xs text-muted-foreground">
                  L&apos;OAuth Shopify live resta nascosto finche non sono configurate le env vars di Supabase e Shopify.
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricTile
                label="Installata il"
                value={
                  storeConnection.installedAt
                    ? formatShortDate(storeConnection.installedAt)
                    : "Non installata"
                }
                tone="default"
                valueSize="sm"
                className="min-h-[112px] rounded-[22px] bg-background/78 p-4"
              />
              <MetricTile
                label="Ultimo webhook"
                value={
                  storeConnection.lastWebhookAt
                    ? formatShortDate(storeConnection.lastWebhookAt)
                    : "Nessun webhook ricevuto"
                }
                tone="default"
                valueSize="sm"
                className="min-h-[112px] rounded-[22px] bg-background/78 p-4"
              />
            </div>

            <div className="rounded-[22px] border border-border/70 bg-background/78 p-4">
              <div className="mb-3 text-sm font-medium">Scope Shopify richiesti</div>
              <div className="grid gap-3">
                {SHOPIFY_SCOPE_OPTIONS.map((scope) => {
                  const granted = storeConnection.grantedScopes.includes(scope.value);

                  return (
                    <div
                      key={scope.value}
                      className="flex items-start justify-between gap-4 rounded-[18px] border border-border/70 bg-white p-3"
                    >
                      <div>
                        <div className="text-sm font-medium">{scope.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {scope.description}
                        </div>
                      </div>
                      <StatusBadge status={granted ? "granted" : "missing"} />
                    </div>
                  );
                })}
              </div>
            </div>

            <MetricTile
              label="Issue aperte sul layer store"
              value={String(
                health.failedJobsCount + health.failedWebhooksCount + health.missingScopes.length,
              )}
              hint="Elementi aperti tra sync falliti, webhook falliti e scope mancanti."
              tone="default"
              valueSize="sm"
              className="min-h-[118px] rounded-[22px] bg-background/78 p-4"
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Cabina di regia sincronizzazioni</CardTitle>
            <p className="text-sm text-muted-foreground">
              Avvia e ripeti i job Shopify senza uscire dall&apos;hub operativo merchant.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <StoreSyncJobForm />
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricTile
                label="Freshness catalogo"
                value={
                  storeConnection.lastProductsSyncAt
                    ? formatShortDate(storeConnection.lastProductsSyncAt)
                    : "Nessun sync catalogo"
                }
                tone="default"
                valueSize="sm"
                className="min-h-[112px] rounded-[20px] bg-background/78 p-4"
              />
              <MetricTile
                label="Freshness sconti"
                value={
                  storeConnection.lastDiscountSyncAt
                    ? formatShortDate(storeConnection.lastDiscountSyncAt)
                    : "Nessun sync sconti"
                }
                tone="default"
                valueSize="sm"
                className="min-h-[112px] rounded-[20px] bg-background/78 p-4"
              />
              <MetricTile
                label="Freshness ordini"
                value={
                  storeConnection.lastOrdersSyncAt
                    ? formatShortDate(storeConnection.lastOrdersSyncAt)
                    : "Nessun sync ordini"
                }
                tone="default"
                valueSize="sm"
                className="min-h-[112px] rounded-[20px] bg-background/78 p-4"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Ultimi job di sync</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ogni esecuzione mostra stream, source of truth, aggiornamento e possibili errori da ritentare.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncJobs.slice(0, 6).map((job) => (
              <div
                key={job.id}
                className="rounded-[24px] border border-border/70 bg-background/78 p-4"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{formatSyncTypeLabel(job.type)}</div>
                      <StatusBadge status={job.status} />
                      <Badge variant="outline">{formatModeLabel(job.mode)}</Badge>
                      <Badge variant="outline">{formatSourceLabel(job.sourceOfTruth)}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {job.notes ?? "Nessuna nota merchant associata."}
                    </div>
                    {job.errorMessage ? (
                      <div className="mt-3 rounded-[18px] border border-border/70 bg-white p-3 text-sm text-foreground">
                        {job.errorMessage}
                      </div>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px] xl:grid-cols-4">
                    <MetricTile
                      label="Processati"
                      value={String(job.recordsProcessed)}
                      tone="default"
                      valueSize="sm"
                      className="min-h-[108px] rounded-[18px] bg-white p-3"
                    />
                    <MetricTile
                      label="Creati"
                      value={String(job.recordsCreated)}
                      tone="default"
                      valueSize="sm"
                      className="min-h-[108px] rounded-[18px] bg-white p-3"
                    />
                    <MetricTile
                      label="Aggiornati"
                      value={String(job.recordsUpdated)}
                      tone="default"
                      valueSize="sm"
                      className="min-h-[108px] rounded-[18px] bg-white p-3"
                    />
                    <MetricTile
                      label="Falliti"
                      value={String(job.recordsFailed)}
                      tone="default"
                      valueSize="sm"
                      className="min-h-[108px] rounded-[18px] bg-white p-3"
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div>
                    Richiesto il {formatShortDate(job.requestedAt)}
                    {job.completedAt ? ` · Completato il ${formatShortDate(job.completedAt)}` : ""}
                  </div>
                  {job.status === "failed" || job.status === "partial" ? (
                    <RetryStoreSyncJobButton jobId={job.id} />
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Simulazione webhook QA</CardTitle>
            <p className="text-sm text-muted-foreground">
              Usa questo flusso merchant per testare eventi ordine, sconto e uninstall finche i webhook Shopify live non sono completamente cablati.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <StoreWebhookIntakeForm />
            <div className="rounded-[22px] border border-border/70 bg-background/78 p-4 text-sm text-muted-foreground">
              Gli eventi ordine in ingresso creano o aggiornano la tracciabilita delle conversioni solo quando gli input di attribuzione risolvono correttamente su risorse affiliate.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Storico webhook</CardTitle>
            <p className="text-sm text-muted-foreground">
              Gli eventi falliti restano visibili finche non vengono ritentati, cosi il merchant puo fidarsi di cio che arriva davvero nel ledger commissionale.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {webhookRecords.slice(0, 6).map((record) => (
              <div
                key={record.id}
                className="rounded-[24px] border border-border/70 bg-background/78 p-4"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{record.topic}</div>
                      <StatusBadge status={record.status} />
                      <Badge variant="outline">{record.shopDomain}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Evento {record.externalEventId}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Ordine {record.orderId ?? "n/d"} · Referral {record.referralCode ?? "n/d"} · Sconto {record.discountCode ?? "n/d"}
                    </div>
                    {record.errorMessage ? (
                      <div className="mt-3 rounded-[18px] border border-border/70 bg-white p-3 text-sm">
                        {record.errorMessage}
                      </div>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[360px]">
                    <MetricTile
                      label="Tentativi"
                      value={String(record.attempts)}
                      tone="default"
                      valueSize="sm"
                      className="min-h-[108px] rounded-[18px] bg-white p-3"
                    />
                    <MetricTile
                      label="Ricevuto"
                      value={formatShortDate(record.receivedAt)}
                      tone="default"
                      valueSize="sm"
                      className="min-h-[108px] rounded-[18px] bg-white p-3"
                    />
                    <MetricTile
                      label="Conversione"
                      value={
                        record.conversionId ? (
                          <Link href="/admin/conversions" className="underline underline-offset-4">
                            Collegata
                          </Link>
                        ) : (
                          "Nessuna"
                        )
                      }
                      tone="default"
                      valueSize="sm"
                      className="min-h-[108px] rounded-[18px] bg-white p-3"
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div>
                    Processato{" "}
                    {record.processedAt ? formatShortDate(record.processedAt) : "non ancora"}
                  </div>
                  {record.status === "failed" ? (
                    <RetryWebhookIngestionButton recordId={record.id} />
                  ) : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Governance destinazioni</CardTitle>
            <p className="text-sm text-muted-foreground">
              Decidi quali pagine Shopify possono ricevere traffico dagli affiliati e quale ancora l&apos;esperienza di default del programma.
            </p>
          </CardHeader>
          <CardContent>
            <StoreCatalogRulesForm
              items={catalogItems}
              defaultDestinationUrl={storeConnection.defaultDestinationUrl}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Fonte dati e freschezza</CardTitle>
            <p className="text-sm text-muted-foreground">
              Mantieni chiaro il modello dati del merchant: cosa arriva da Shopify, cosa e ibrido e quanto e aggiornata ogni superficie.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {sourceOfTruth.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-border/70 bg-background/78 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium">{item.label}</div>
                  <Badge variant="outline">{formatSourceLabel(item.source)}</Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{item.detail}</div>
                <div className="mt-3 text-xs text-muted-foreground">
                  {item.freshness ? `Aggiornato al ${formatShortDate(item.freshness)}` : "Nessun timestamp di sync registrato"}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Destinazioni collegate allo store</CardTitle>
            <p className="text-sm text-muted-foreground">
              Questi nodi storefront sono gia usati da campagne, link e codici all&apos;interno del programma.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {storeUsage.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="rounded-[24px] border border-border/70 bg-background/78 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{item.title}</div>
                      <Badge variant="outline">{item.type}</Badge>
                      <StatusBadge status={item.isAffiliateEnabled ? "active" : "disabled"} />
                    </div>
                    <div className="mt-2 break-all text-sm text-muted-foreground">
                      {item.destinationUrl}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <a href={item.destinationUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 size-4" />
                      Apri
                    </a>
                  </Button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricTile
                    label="Campagne"
                    value={String(item.linkedCampaigns.length)}
                    tone="default"
                    valueSize="sm"
                    className="min-h-[108px] rounded-[18px] bg-white p-3"
                  />
                  <MetricTile
                    label="Link"
                    value={String(item.linkedLinks.length)}
                    tone="default"
                    valueSize="sm"
                    className="min-h-[108px] rounded-[18px] bg-white p-3"
                  />
                  <MetricTile
                    label="Codici"
                    value={String(item.linkedCodes.length)}
                    tone="default"
                    valueSize="sm"
                    className="min-h-[108px] rounded-[18px] bg-white p-3"
                  />
                  <MetricTile
                    label="Ricavi collegati"
                    value={formatCurrency(item.linkedRevenue)}
                    tone="default"
                    valueSize="sm"
                    className="min-h-[108px] rounded-[18px] bg-white p-3"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Prossime azioni merchant</CardTitle>
            <p className="text-sm text-muted-foreground">
              Usa questa coda quando il layer Shopify e il vero collo di bottiglia, non le operations affiliate.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              storeConnection.installState !== "installed"
                ? "Completa l&apos;installazione dell&apos;app Shopify prima di fidarti di catalogo e dati ordine."
                : null,
              health.missingScopes.length
                ? `Concedi gli scope mancanti: ${health.missingScopes.join(", ")}.`
                : null,
              failedJobs.length
                ? `${failedJobs.length} esecuzion${failedJobs.length > 1 ? "i" : "e"} di sync richiedono un nuovo tentativo o una revisione.`
                : null,
              failedWebhooks.length
                ? `${failedWebhooks.length} event${failedWebhooks.length > 1 ? "i webhook hanno" : "o webhook ha"} fallito l&apos;elaborazione e va ritentato.`
                : null,
              !storeConnection.appEmbedEnabled && storeConnection.orderAttributionEnabled
                ? "Attiva il theme app embed prima di fidarti dell&apos;attribuzione storefront."
                : null,
            ]
              .filter(Boolean)
              .map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[22px] border border-border/70 bg-background/78 p-4"
                >
                  <AlertTriangle className="mt-0.5 size-4 flex-none text-foreground" />
                  <div className="text-sm">{item}</div>
                </div>
              ))}
            {!(
              storeConnection.installState !== "installed" ||
              health.missingScopes.length ||
              failedJobs.length ||
              failedWebhooks.length ||
              (!storeConnection.appEmbedEnabled && storeConnection.orderAttributionEnabled)
            ) ? (
              <div className="rounded-[22px] border border-border/70 bg-background/78 p-4 text-sm">
                Installazione Shopify, sync e webhook sono attualmente in uno stato operativo affidabile.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}



