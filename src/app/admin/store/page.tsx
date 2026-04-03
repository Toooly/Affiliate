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
import { EmptyState } from "@/components/shared/empty-state";
import { MetricTile } from "@/components/shared/metric-tile";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SHOPIFY_SCOPE_OPTIONS } from "@/lib/constants";
import { getRepository } from "@/lib/data/repository";
import { isShopifyConfigured } from "@/lib/env";
import { evaluateStoreConnectionHealth } from "@/lib/shopify";
import { isValidShopifyShopDomain } from "@/lib/shopify-bridge";
import {
  getStorefrontHostLabel,
  isOperationalStoreConnection,
} from "@/lib/storefront";
import { formatCurrency, formatPublicUrl, formatShortDate, formatUiLabel } from "@/lib/utils";

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
  const liveBridgeEnabled = isShopifyConfigured();
  const shopifyOperational = isOperationalStoreConnection(storeConnection);
  const canStartShopifyInstall =
    liveBridgeEnabled &&
    isValidShopifyShopDomain(storeConnection.shopDomain) &&
    !shopifyOperational;
  const shopifyCallbackMessage =
    params.shopify === "connected"
      ? "Shopify e stato collegato correttamente e il primo sync catalogo e stato avviato."
      : params.shopify === "connected_with_sync_issue"
        ? "Shopify e stato collegato, ma il primo sync catalogo richiede una verifica."
        : params.shopify === "invalid_hmac"
          ? "La firma della callback Shopify non e stata verificata."
        : params.shopify === "invalid_state"
            ? "Lo stato della callback Shopify non coincide con la sessione di installazione."
            : params.shopify === "invalid_shop"
              ? "Inserisci un dominio Shopify valido prima di avviare l'installazione."
              : params.shopify === "invalid_callback"
                ? "La callback Shopify e incompleta o non contiene i parametri attesi."
            : params.shopify === "bridge_not_configured"
              ? "La configurazione del bridge Shopify non e completa: verifica env vars e app config prima di installare."
              : null;
  const sourceOfTruth = [
    {
      label: "Destinazioni catalogo",
      source: "shopify",
      freshness: storeConnection.lastProductsSyncAt,
      detail: `${storeConnection.productsSyncedCount} prodotti e ${storeConnection.collectionsSyncedCount} collection disponibili per il routing affiliate.`,
    },
    {
      label: "Governance codici",
      source: "hybrid",
      freshness: storeConnection.lastDiscountSyncAt,
      detail: `${storeConnection.discountsSyncedCount} codici o ownership gia registrati nel programma e pronti per il controllo merchant.`,
    },
    {
      label: "Eventi ordine",
      source: "webhook",
      freshness: storeConnection.lastWebhookAt,
      detail: `${processedWebhooks.length} webhook processati e ${storeAttributedConversions.length} conversioni attribuite collegate ai segnali store.`,
    },
    {
      label: "Tracking storefront",
      source: "hybrid",
      freshness: storeConnection.lastHealthCheckAt,
      detail: "Referral link, theme app embed e regole destinazione collaborano per mantenere coerente l'attribuzione.",
    },
  ];

  return (
    <div className="space-y-6">
      {shopifyCallbackMessage ? (
        <Card>
          <CardContent className="p-4 text-sm">{shopifyCallbackMessage}</CardContent>
        </Card>
      ) : null}

      {!liveBridgeEnabled ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Il bridge Shopify non e ancora configurato in questo ambiente. Puoi completare la scheda store da qui e attivare OAuth non appena env vars e config CLI saranno disponibili.
          </CardContent>
        </Card>
      ) : null}

      {liveBridgeEnabled && shopifyOperational ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            Shopify risulta gia operativo lato backend. Questa pagina serve per monitorare sincronizzazioni, webhook, destinazioni storefront e dettagli integrazione senza ripetere onboarding o wizard manuali.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="ui-surface-overline text-muted-foreground">
              <Store className="size-4" />
              Operazioni store Shopify
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Gestisci integrazione, catalogo, webhook e salute operativa del collegamento Shopify.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              Questo hub merchant mostra se il catalogo e aggiornato, quali job richiedono attenzione e se i webhook stanno alimentando il ledger commissionale in modo affidabile, senza chiederti di ricollegare manualmente Shopify quando il backend e gia attivo.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/admin">Apri cabina di regia</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/conversions">Apri ledger commissioni</Link>
            </Button>
            {canStartShopifyInstall ? (
              <Button asChild variant="outline">
                <Link href={`/api/shopify/install?shop=${encodeURIComponent(storeConnection.shopDomain)}`}>
                  Ricollega Shopify
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="#store-connection-settings">
                  {shopifyOperational ? "Gestisci dettagli integrazione" : liveBridgeEnabled ? "Completa dettagli store" : "Configura bridge Shopify"}
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Stato installazione"
          value={formatUiLabel(storeConnection.installState)}
          hint={
            storeConnection.shopDomain ||
            getStorefrontHostLabel(storeConnection.storefrontUrl)
          }
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

      <section className="ui-section-split ui-section-split-balanced">
        <Card id="store-connection-settings">
          <CardHeader className="pb-4">
            <CardTitle>Dettagli integrazione store</CardTitle>
            <p className="text-sm text-muted-foreground">
              Gestisci stato operativo, dominio Shopify, destinazione storefront e permessi concessi da un&apos;unica superficie merchant.
            </p>
          </CardHeader>
          <CardContent>
            <StoreConnectionForm initialValues={storeConnection} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Readiness integrazione</CardTitle>
            <p className="text-sm text-muted-foreground">
              Il merchant deve capire subito se permessi, tracking e webhook sono abbastanza affidabili da sostenere il programma senza dover ripassare dal flusso di connessione.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="ui-panel-block">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={storeConnection.installState} />
                <StatusBadge status={storeConnection.status} />
                <StatusBadge status={storeConnection.connectionHealth} />
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                {storeConnection.lastHealthError ??
                  "Non sono stati rilevati problemi bloccanti di installazione o connessione."}
              </div>
              {shopifyOperational ? (
                <div className="mt-3 text-xs text-muted-foreground">
                  Stato operativo: integrazione gia attiva e governata dal backend.
                </div>
              ) : null}
              {!liveBridgeEnabled ? (
                <div className="mt-3 text-xs text-muted-foreground">
                  OAuth Shopify resta inattivo finche non sono configurate le env vars richieste da Supabase e Shopify.
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricTile
                label="Installata il"
                value={
                  storeConnection.installedAt
                    ? formatShortDate(storeConnection.installedAt)
                    : shopifyOperational
                      ? "Gia operativa"
                      : "Non installata"
                }
                tone="default"
                valueSize="sm"
                density="compact"
                className="ui-mini-metric"
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
                density="compact"
                className="ui-mini-metric"
              />
            </div>

            <div className="ui-panel-block">
              <div className="mb-3 text-sm font-medium">Scope Shopify richiesti</div>
              <div className="grid gap-3">
                {SHOPIFY_SCOPE_OPTIONS.map((scope) => {
                  const granted = storeConnection.grantedScopes.includes(scope.value);

                  return (
                    <div
                      key={scope.value}
                      className="flex items-start justify-between gap-4 ui-surface-panel"
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
              density="compact"
              className="ui-mini-metric"
            />
          </CardContent>
        </Card>
      </section>

      <section className="ui-section-split ui-section-split-sidebar">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Cabina di regia sincronizzazioni</CardTitle>
            <p className="text-sm text-muted-foreground">
              Avvia e ripeti i job catalogo supportati senza uscire dall&apos;hub operativo merchant.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <StoreSyncJobForm />
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricTile
                label="Prodotti"
                value={
                  storeConnection.lastProductsSyncAt
                    ? formatShortDate(storeConnection.lastProductsSyncAt)
                    : "Nessun sync catalogo"
                }
                tone="default"
                valueSize="sm"
                density="compact"
                className="ui-mini-metric"
              />
              <MetricTile
                label="Collezioni e pagine"
                value={
                  lastSuccessfulSync
                    ? formatShortDate(lastSuccessfulSync.completedAt ?? lastSuccessfulSync.createdAt)
                    : "Nessun sync disponibile"
                }
                tone="default"
                valueSize="sm"
                density="compact"
                className="ui-mini-metric"
              />
              <MetricTile
                label="Webhook"
                value={
                  storeConnection.lastWebhookAt
                    ? formatShortDate(storeConnection.lastWebhookAt)
                    : "Nessun webhook ricevuto"
                }
                tone="default"
                valueSize="sm"
                density="compact"
                className="ui-mini-metric"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Ultimi job di sync</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ogni esecuzione mostra il flusso sincronizzato, l&apos;origine dati e gli eventuali errori da ritentare.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {syncJobs.length ? (
              syncJobs.slice(0, 6).map((job) => (
                <div key={job.id} className="ui-panel-block">
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
                        <div className="mt-3 ui-surface-panel text-sm text-foreground">
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
                        density="compact"
                        className="ui-mini-metric"
                      />
                      <MetricTile
                        label="Creati"
                        value={String(job.recordsCreated)}
                        tone="default"
                        valueSize="sm"
                        density="compact"
                        className="ui-mini-metric"
                      />
                      <MetricTile
                        label="Aggiornati"
                        value={String(job.recordsUpdated)}
                        tone="default"
                        valueSize="sm"
                        density="compact"
                        className="ui-mini-metric"
                      />
                      <MetricTile
                        label="Falliti"
                        value={String(job.recordsFailed)}
                        tone="default"
                        valueSize="sm"
                        density="compact"
                        className="ui-mini-metric"
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
              ))
            ) : (
              <EmptyState
                icon={RefreshCcw}
                title="Nessun job di sync registrato"
                description="I log di sincronizzazione compariranno qui solo dopo un avvio reale del catalogo o delle collection."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="ui-section-split ui-section-split-balanced">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Console webhook</CardTitle>
            <p className="text-sm text-muted-foreground">
              Usa questo flusso per registrare eventi di verifica, backfill operativo o test controllati sui payload store.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <StoreWebhookIntakeForm />
              <div className="ui-surface-panel text-sm text-muted-foreground">
                Gli eventi ordine in ingresso possono creare conversioni reali solo quando referral link e codici promo si risolvono correttamente sulle risorse affiliate attive.
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
            {webhookRecords.length ? (
              webhookRecords.slice(0, 6).map((record) => (
                <div key={record.id} className="ui-panel-block">
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
                        <div className="mt-3 ui-surface-panel text-sm">
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
                        density="compact"
                        className="ui-mini-metric"
                      />
                      <MetricTile
                        label="Ricevuto"
                        value={formatShortDate(record.receivedAt)}
                        tone="default"
                        valueSize="sm"
                        density="compact"
                        className="ui-mini-metric"
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
                        density="compact"
                        className="ui-mini-metric"
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
              ))
            ) : (
              <EmptyState
                icon={Webhook}
                title="Nessun webhook acquisito"
                description="Lo storico webhook si popolera solo dopo l'arrivo di eventi reali o test controllati acquisiti dal merchant."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="ui-section-split ui-section-split-balanced">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Governance destinazioni</CardTitle>
            <p className="text-sm text-muted-foreground">
              Decidi quali pagine Shopify possono ricevere traffico dagli affiliati e quale ancora l&apos;esperienza di default del programma.
            </p>
          </CardHeader>
          <CardContent>
            {catalogItems.length ? (
              <StoreCatalogRulesForm
                items={catalogItems}
                defaultDestinationUrl={storeConnection.defaultDestinationUrl}
              />
            ) : (
              <EmptyState
                icon={Waypoints}
                title="Nessuna destinazione sincronizzata"
                description="Le regole di catalogo si attiveranno quando Shopify avra sincronizzato almeno una pagina, collection o prodotto reale."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Fonte dati e freschezza</CardTitle>
            <p className="text-sm text-muted-foreground">
              Mantieni chiaro il modello dati del merchant: cosa arriva da Shopify, cosa e gestito in piattaforma e quanto e aggiornata ogni superficie.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {sourceOfTruth.map((item) => (
              <div key={item.label} className="ui-panel-block">
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

      <section className="ui-section-split ui-section-split-balanced">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Destinazioni collegate allo store</CardTitle>
            <p className="text-sm text-muted-foreground">
              Questi nodi storefront sono gia usati da campagne, link e codici all&apos;interno del programma.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {storeUsage.length ? (
              storeUsage.slice(0, 4).map((item) => (
                <div key={item.id} className="ui-panel-block">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{item.title}</div>
                        <Badge variant="outline">{item.type}</Badge>
                        <StatusBadge status={item.isAffiliateEnabled ? "active" : "disabled"} />
                      </div>
                      <div className="ui-wrap-anywhere mt-2 text-sm text-muted-foreground">
                        {formatPublicUrl(item.destinationUrl)}
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
                      density="compact"
                      className="ui-mini-metric"
                    />
                    <MetricTile
                      label="Link"
                      value={String(item.linkedLinks.length)}
                      tone="default"
                      valueSize="sm"
                      density="compact"
                      className="ui-mini-metric"
                    />
                    <MetricTile
                      label="Codici"
                      value={String(item.linkedCodes.length)}
                      tone="default"
                      valueSize="sm"
                      density="compact"
                      className="ui-mini-metric"
                    />
                    <MetricTile
                      label="Ricavi collegati"
                      value={formatCurrency(item.linkedRevenue)}
                      tone="default"
                      valueSize="sm"
                      density="compact"
                      className="ui-mini-metric"
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Store}
                title="Nessuna destinazione collegata allo store"
                description="Questa vista mostrera pagine, collection e prodotti solo dopo una sincronizzazione reale da Shopify."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Prossime azioni merchant</CardTitle>
            <p className="text-sm text-muted-foreground">
              Usa questa coda quando il layer Shopify richiede attenzione prima di riaprire il normale flusso operativo.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              storeConnection.installState !== "installed"
                ? "Completa l'installazione dell'app Shopify prima di fidarti di catalogo e dati ordine."
                : null,
              health.missingScopes.length
                ? `Concedi gli scope mancanti: ${health.missingScopes.join(", ")}.`
                : null,
              failedJobs.length
                ? `${failedJobs.length} esecuzion${failedJobs.length > 1 ? "i" : "e"} di sync richiedono un nuovo tentativo o una revisione.`
                : null,
              failedWebhooks.length
                ? `${failedWebhooks.length} event${failedWebhooks.length > 1 ? "i webhook hanno" : "o webhook ha"} fallito l'elaborazione e va ritentato.`
                : null,
              !storeConnection.appEmbedEnabled && storeConnection.orderAttributionEnabled
                ? "Attiva il theme app embed prima di fidarti dell'attribuzione storefront."
                : null,
            ]
              .filter(Boolean)
              .map((item) => (
                <div key={item} className="ui-panel-block flex items-start gap-3">
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
                <div className="ui-surface-panel text-sm">
                Installazione Shopify, sync e webhook sono attualmente in uno stato operativo affidabile.
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}



