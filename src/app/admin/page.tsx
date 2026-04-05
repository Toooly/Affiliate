import Link from "next/link";

import {
  BadgeDollarSign,
  Link2,
  Megaphone,
  MousePointerClick,
  ReceiptText,
  ShieldAlert,
  Store,
  TicketPercent,
  Users,
} from "lucide-react";

import { PerformanceChart } from "@/components/charts/performance-chart";
import { AutoGrid } from "@/components/shared/auto-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricTile } from "@/components/shared/metric-tile";
import { SuspiciousEventReviewForm } from "@/components/forms/suspicious-event-review-form";
import { RecordCard } from "@/components/shared/record-card";
import { SectionSplit } from "@/components/shared/section-split";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import {
  getStorefrontHostLabel,
  isOperationalStoreConnection,
} from "@/lib/storefront";
import { formatCurrency, formatPublicUrl } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const [data, storeConnection, catalogItems] = await Promise.all([
    getRepository().getAdminOverview(),
    getRepository().getStoreConnection(),
    getRepository().listStoreCatalogItems(),
  ]);
  const pendingApplications = data.recentApplications.filter(
    (application) => application.status === "pending",
  ).length;
  const activeRatio = Math.round(
    (data.kpis.activeInfluencers / Math.max(data.kpis.totalInfluencers, 1)) * 100,
  );
  const shopifyOperational = isOperationalStoreConnection(storeConnection);
  const storeWorkspaceLabel =
    shopifyOperational ? "Gestisci integrazione Shopify" : "Allinea integrazione Shopify";

  return (
    <div className="ui-page-stack">
      <SectionSplit
        primary={
          <Card className="surface-admin overflow-hidden">
            <CardContent className="p-7 md:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                <div className="ui-surface-overline">
                  Cabina di regia merchant
                </div>
                <h2 className="ui-page-title mt-4">
                  Gestisci il programma affiliati del tuo store Shopify da un&apos;unica superficie operativa.
                </h2>
                <p className="mt-4 text-sm leading-7 ui-surface-copy">
                  Rivedi la coda, attiva i partner, controlla le destinazioni store, monitora link e codici promo e fai avanzare commissioni e payout senza attrito.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={storeConnection.status}
                    className="ui-surface-status"
                  />
                  <div className="ui-surface-pill">
                    {storeConnection.shopDomain ||
                      getStorefrontHostLabel(storeConnection.storefrontUrl)}
                  </div>
                </div>
                </div>
                <div className="ui-hero-aside">
                  <AutoGrid minItemWidth="9.75rem">
                  <MetricTile
                    tone="surface"
                    label="Candidature in attesa"
                    value={pendingApplications}
                    valueSize="lg"
                    valueType="metric"
                    density="hero"
                  />
                  <MetricTile
                    tone="surface"
                    label="Richieste codice in attesa"
                    value={data.kpis.pendingPromoCodeRequests}
                    valueSize="lg"
                    valueType="metric"
                    density="hero"
                  />
                  <MetricTile
                    tone="surface"
                    label="Campagne attive"
                    value={data.kpis.activeCampaigns}
                    valueSize="lg"
                    valueType="metric"
                    density="hero"
                  />
                  <MetricTile
                    tone="surface"
                    label="Tasso attivazione"
                    value={`${activeRatio}%`}
                    valueSize="lg"
                    valueType="metric"
                    density="hero"
                  />
                  </AutoGrid>
                </div>
              </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/admin/store">{storeWorkspaceLabel}</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/admin/applications">Rivedi candidature</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="ui-surface-action"
              >
                <Link href="/admin/affiliates">Gestisci affiliati</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="ui-surface-action"
              >
                <Link href="/admin/codes">Gestisci codici promo</Link>
              </Button>
            </div>
          </CardContent>
          </Card>
        }
        secondary={
          <Card>
          <CardHeader className="pb-4">
            <CardTitle>Storefront operativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="ui-panel-block ui-panel-block-strong">
              <div className="ui-surface-overline text-muted-foreground">
                Vetrina
              </div>
              <div className="ui-wrap-anywhere mt-2 text-xl font-semibold tracking-tight">
                {storeConnection.storefrontUrl ? formatPublicUrl(storeConnection.storefrontUrl) : "Destinazione storefront da definire"}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {shopifyOperational
                  ? "Lato backend l&apos;integrazione Shopify \u00E8 gi\u00E0 attiva. Da qui gestisci stato operativo, routing e sync."
                  : "Completa i dettagli residui solo se il backend segnala davvero un setup incompleto."}
              </div>
            </div>
            <AutoGrid minItemWidth="10rem">
              <MetricTile
                tone="muted"
                label="Sync prodotti"
                value={
                  <StatusBadge
                    status={storeConnection.syncProductsEnabled ? "ready" : "not_connected"}
                  />
                }
                valueSize="sm"
                valueType="text"
                density="compact"
              />
              <MetricTile
                tone="muted"
                label="Sync sconti"
                value={
                  <StatusBadge
                    status={
                      storeConnection.syncDiscountCodesEnabled ? "ready" : "not_connected"
                    }
                  />
                }
                valueSize="sm"
                valueType="text"
                density="compact"
              />
              <MetricTile
                tone="default"
                label="Commissione standard"
                value={`${data.defaultCommissionValue}%`}
                valueSize="md"
                valueType="metric"
                density="compact"
              />
              <MetricTile
                tone="default"
                label="Destinazioni Shopify abilitate"
                value={catalogItems.filter((item) => item.isAffiliateEnabled).length}
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

      <AutoGrid minItemWidth="12rem" gap="md">
        <StatCard
          label="Affiliati"
          value={String(data.kpis.totalInfluencers)}
          hint={`${data.kpis.activeInfluencers} attivi`}
          icon={Users}
        />
        <StatCard
          label="Click"
          value={String(data.kpis.totalClicks)}
          hint="Visite referral tracciate"
          icon={MousePointerClick}
        />
        <StatCard
          label="Conversioni"
          value={String(data.kpis.totalConversions)}
          hint="Ordini in attesa e approvati"
          icon={ReceiptText}
        />
        <StatCard
          label="Esposizione commissionale"
          value={formatCurrency(data.kpis.totalCommissionLiability)}
          hint="Su commissioni non ancora pagate"
          icon={BadgeDollarSign}
          emphasis
        />
        <StatCard
          label="Flag rischio"
          value={String(data.kpis.openFraudFlags)}
          hint={`${data.kpis.pendingPayouts} payout in attesa`}
          icon={ShieldAlert}
        />
      </AutoGrid>

      <SectionSplit
        primary={<PerformanceChart title="Performance programma" data={data.performance} />}
        secondary={
          <Card>
          <CardHeader className="pb-4">
            <CardTitle>Coda operativa</CardTitle>
            <p className="text-sm text-muted-foreground">
              Il percorso pi&ugrave; rapido per far avanzare il programma questa settimana.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                href: "/admin/store",
                icon: Store,
                label: "Connessione store",
                value:
                  storeConnection.status === "connected"
                    ? "Connesso"
                    : storeConnection.status === "attention_required"
                      ? "Attenzione"
                      : "Non connesso",
                hint: "Mantieni allineati destinazioni Shopify, sync e tracking",
              },
              {
                href: "/admin/store",
                icon: Store,
                label: "Governance destinazioni",
                value: `${catalogItems.filter((item) => item.isAffiliateEnabled).length}`,
                hint: "Definisci quali pagine Shopify possono essere promosse dagli affiliati",
              },
              {
                href: "/admin/applications",
                icon: Users,
                label: "Candidature da rivedere",
                value: `${pendingApplications}`,
                hint: "Approva nuovi affiliati e assegna il primo codice con il primo link",
              },
              {
                href: "/admin/codes",
                icon: TicketPercent,
                label: "Richieste codice in attesa",
                value: `${data.kpis.pendingPromoCodeRequests}`,
                hint: "Approva o rifiuta i codici promo richiesti",
              },
              {
                href: "/admin/campaigns",
                icon: Megaphone,
                label: "Campagne live",
                value: `${data.kpis.activeCampaigns}`,
                hint: "Controlla copertura, asset e coerenza promo",
              },
              {
                href: "/admin/links",
                icon: Link2,
                label: "Link monitorati",
                value: `${data.topLinks.length}`,
                hint: "Analizza le destinazioni migliori e metti in pausa quelle deboli",
              },
              {
                href: "/admin/settings",
                icon: ShieldAlert,
                label: "Flag rischio aperti",
                value: `${data.kpis.openFraudFlags}`,
                hint: "Rivedi le anomalie prima di approvare payout e commissioni",
              },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="ui-panel-block ui-panel-block-interactive flex items-start justify-between gap-4"
              >
                <div className="flex gap-3">
                  <div className="ui-icon-chip flex size-11 shrink-0 items-center justify-center rounded-[18px]">
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="mt-1 text-sm leading-6 text-muted-foreground">
                      {item.hint}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="ui-card-title">{item.value}</div>
                  <div className="mt-1 text-xs tracking-[0.16em] text-muted-foreground uppercase">
                    Apri
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
          </Card>
        }
        asideWidth="24rem"
      />

      <SectionSplit
        variant="balanced"
        primary={
          <Card>
          <CardHeader className="pb-4">
            <CardTitle>Referral link top performer</CardTitle>
            <p className="text-sm text-muted-foreground">
              I link operativi che in questo momento meritano pi&ugrave; attenzione.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.topLinks.length ? (
              data.topLinks.slice(0, 5).map((link) => (
                <RecordCard key={link.id} className="p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{link.name}</div>
                      <StatusBadge status={link.isActive ? "active" : "inactive"} />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {link.influencerName} / r/{link.code}
                    </div>
                    <div className="ui-wrap-anywhere mt-1 text-sm text-muted-foreground">
                      {formatPublicUrl(link.destinationUrl)}
                    </div>
                  </div>
                  <div className="grid gap-1 text-right text-sm">
                    <div>{link.clicks} click</div>
                    <div>{link.conversions} conversioni</div>
                    <div className="font-medium">{formatCurrency(link.revenue)}</div>
                  </div>
                </RecordCard>
              ))
            ) : (
              <EmptyState
                icon={Link2}
                title="Nessun link registrato"
                description="I referral link appariranno qui solo dopo la creazione reale da parte degli affiliati o del team merchant."
                actionLabel="Apri area link"
                actionHref="/admin/links"
              />
            )}
          </CardContent>
          </Card>
        }
        secondary={
          <Card>
          <CardHeader className="pb-4">
            <CardTitle>Top affiliati per fatturato</CardTitle>
            <p className="text-sm text-muted-foreground">
              Partner che stanno gi&agrave; dimostrando il valore economico del programma.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            {data.topInfluencers.length ? (
              data.topInfluencers.map((affiliate, index) => (
                <Link
                  key={affiliate.id}
                  href={`/admin/affiliates/${affiliate.id}`}
                  className="ui-card-soft-interactive rounded-[26px] p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                        Posizione {index + 1}
                      </div>
                      <div className="mt-2 font-medium">{affiliate.fullName}</div>
                      <div className="text-sm text-muted-foreground">{affiliate.email}</div>
                    </div>
                    <StatusBadge status={affiliate.isActive ? "active" : "disabled"} />
                  </div>
                  <AutoGrid minItemWidth="8.25rem" className="mt-5">
                    <MetricTile
                      label="Fatturato"
                      value={formatCurrency(affiliate.stats.totalRevenue)}
                      valueSize="sm"
                      valueType="metric"
                      density="compact"
                      className="ui-mini-metric"
                    />
                    <MetricTile
                      label="Conversioni"
                      value={String(affiliate.stats.conversions)}
                      valueSize="sm"
                      valueType="metric"
                      density="compact"
                      className="ui-mini-metric"
                    />
                  </AutoGrid>
                </Link>
              ))
            ) : (
              <EmptyState
                icon={Users}
                title="Nessun affiliato attivo"
                description={
                  "La classifica si popoler\u00E0 quando il merchant approver\u00E0 o inviter\u00E0 i primi partner nel programma."
                }
                actionLabel="Apri candidature"
                actionHref="/admin/applications"
              />
            )}
          </CardContent>
          </Card>
        }
      />

      <SectionSplit
        variant="balanced"
        primary={
          <Card>
          <CardHeader className="pb-4">
            <CardTitle>Top codici promo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Performance coupon per fatturato influenzato e commissioni generate.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.topPromoCodes.length ? (
              data.topPromoCodes.map((promoCode) => (
                <RecordCard key={promoCode.id} className="p-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{promoCode.code}</div>
                      <StatusBadge status={promoCode.status} />
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {promoCode.influencerName} / {promoCode.conversions} conversioni
                    </div>
                  </div>
                  <div className="grid gap-1 text-right text-sm">
                    <div>{formatCurrency(promoCode.revenue)} fatturato</div>
                    <div>{formatCurrency(promoCode.commission)} commissioni</div>
                  </div>
                </RecordCard>
              ))
            ) : (
              <EmptyState
                icon={TicketPercent}
                title="Nessun codice promo attivo"
                description="I codici appariranno qui solo dopo una creazione o assegnazione reale all'interno del programma."
                actionLabel="Apri codici promo"
                actionHref="/admin/codes"
              />
            )}
          </CardContent>
          </Card>
        }
        secondary={
          <Card>
          <CardHeader className="pb-4">
            <CardTitle>Coda attivit&agrave; sospette</CardTitle>
            <p className="text-sm text-muted-foreground">
              Eventi che meritano una revisione prima di approvare payout o commissioni.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.suspiciousEvents.length ? (
              data.suspiciousEvents.map((event) => (
                <div
                  key={event.id}
                  className="ui-panel-block"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{event.detail}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={event.severity} />
                      <StatusBadge status={event.status} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <SuspiciousEventReviewForm suspiciousEventId={event.id} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={ShieldAlert}
                title="Nessun alert aperto"
                description="Qui compariranno solo le anomalie generate da click, ordini o controlli reali del programma."
                actionLabel="Apri impostazioni"
                actionHref="/admin/settings"
              />
            )}
          </CardContent>
          </Card>
        }
      />
    </div>
  );
}



