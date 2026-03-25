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
import { MetricTile } from "@/components/shared/metric-tile";
import { SuspiciousEventReviewForm } from "@/components/forms/suspicious-event-review-form";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { formatCurrency } from "@/lib/utils";

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

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="surface-admin overflow-hidden">
          <CardContent className="p-7 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-[11px] font-semibold tracking-[0.18em] text-white/72 uppercase">
                  Cabina di regia merchant
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-[2.45rem]">
                  Gestisci il programma affiliate del tuo store Shopify da un&apos;unica superficie operativa.
                </h2>
                <p className="mt-4 text-sm leading-7 text-white/78">
                  Rivedi la coda, attiva i partner, controlla le destinazioni store, monitora link e codici promo e fai avanzare commissioni e payout senza attrito.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={storeConnection.status}
                    className="border-white/15 bg-white/10 text-white"
                  />
                  <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/72">
                    {storeConnection.shopDomain}
                  </div>
                </div>
              </div>
              <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:w-[340px]">
                <MetricTile
                  tone="surface"
                  label="Candidature in attesa"
                  value={pendingApplications}
                  valueSize="lg"
                  className="min-h-[128px]"
                />
                <MetricTile
                  tone="surface"
                  label="Richieste codice in attesa"
                  value={data.kpis.pendingPromoCodeRequests}
                  valueSize="lg"
                  className="min-h-[128px]"
                />
                <MetricTile
                  tone="surface"
                  label="Campagne attive"
                  value={data.kpis.activeCampaigns}
                  valueSize="lg"
                  className="min-h-[128px]"
                />
                <MetricTile
                  tone="surface"
                  label="Tasso attivazione"
                  value={`${activeRatio}%`}
                  valueSize="lg"
                  className="min-h-[128px]"
                />
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/admin/store">Configura store</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/admin/applications">Rivedi candidature</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/14 bg-white/8 text-white hover:bg-white/14 hover:text-white"
              >
                <Link href="/admin/affiliates">Gestisci affiliati</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/14 bg-white/8 text-white hover:bg-white/14 hover:text-white"
              >
                <Link href="/admin/codes">Gestisci codici promo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Store collegato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-border/70 bg-muted/70 p-4">
              <div className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Vetrina
              </div>
              <div className="mt-2 break-all text-xl font-semibold tracking-tight">
                {storeConnection.storefrontUrl}
              </div>
            </div>
            <div className="grid auto-rows-fr gap-3 sm:grid-cols-2">
              <MetricTile
                tone="muted"
                label="Sync prodotti"
                value={
                  <StatusBadge
                    status={storeConnection.syncProductsEnabled ? "ready" : "not_connected"}
                  />
                }
                valueSize="sm"
                className="min-h-[118px]"
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
                className="min-h-[118px]"
              />
              <MetricTile
                tone="default"
                label="Commissione standard"
                value={`${data.defaultCommissionValue}%`}
                valueSize="md"
                className="min-h-[118px]"
              />
              <MetricTile
                tone="default"
                label="Destinazioni Shopify abilitate"
                value={catalogItems.filter((item) => item.isAffiliateEnabled).length}
                valueSize="md"
                className="min-h-[118px]"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <PerformanceChart title="Performance programma" data={data.performance} />

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Coda operativa</CardTitle>
            <p className="text-sm text-muted-foreground">
              Il percorso piu rapido per far avanzare il programma questa settimana.
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
                className="flex items-start justify-between gap-4 rounded-[26px] border border-border/70 bg-background/76 p-4 transition hover:border-foreground/20 hover:bg-white"
              >
                <div className="flex gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[18px] bg-secondary text-foreground">
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
                  <div className="text-2xl font-semibold tracking-tight">{item.value}</div>
                  <div className="mt-1 text-xs tracking-[0.16em] text-muted-foreground uppercase">
                    Apri
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Referral link top performer</CardTitle>
            <p className="text-sm text-muted-foreground">
              I link operativi che in questo momento meritano piu attenzione.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.topLinks.slice(0, 5).map((link) => (
              <div
                key={link.id}
                className="flex flex-col gap-4 rounded-[24px] border border-border/70 bg-background/76 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium">{link.name}</div>
                    <StatusBadge status={link.isActive ? "active" : "inactive"} />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {link.influencerName} · /r/{link.code}
                  </div>
                  <div className="mt-1 truncate text-sm text-muted-foreground">
                    {link.destinationUrl}
                  </div>
                </div>
                <div className="grid gap-1 text-right text-sm">
                  <div>{link.clicks} click</div>
                  <div>{link.conversions} conversioni</div>
                  <div className="font-medium">{formatCurrency(link.revenue)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Top affiliati per fatturato</CardTitle>
            <p className="text-sm text-muted-foreground">
              Partner che stanno gia dimostrando il valore economico del programma.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2">
            {data.topInfluencers.map((affiliate, index) => (
              <Link
                key={affiliate.id}
                href={`/admin/affiliates/${affiliate.id}`}
                className="rounded-[26px] border border-border/70 bg-background/76 p-5 transition hover:border-foreground/20 hover:bg-white"
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
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-border/70 bg-white/82 p-3 text-sm">
                    {formatCurrency(affiliate.stats.totalRevenue)} fatturato
                  </div>
                  <div className="rounded-[20px] border border-border/70 bg-white/82 p-3 text-sm">
                    {affiliate.stats.conversions} conversioni
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Top codici promo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Performance coupon per fatturato influenzato e commissioni generate.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.topPromoCodes.map((promoCode) => (
              <div
                key={promoCode.id}
                className="flex flex-col gap-4 rounded-[24px] border border-border/70 bg-background/76 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium">{promoCode.code}</div>
                    <StatusBadge status={promoCode.status} />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {promoCode.influencerName} · {promoCode.conversions} conversioni
                  </div>
                </div>
                <div className="grid gap-1 text-right text-sm">
                  <div>{formatCurrency(promoCode.revenue)} fatturato</div>
                  <div>{formatCurrency(promoCode.commission)} commissioni</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Coda attivita sospette</CardTitle>
            <p className="text-sm text-muted-foreground">
              Eventi che meritano una revisione prima di approvare payout o commissioni.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.suspiciousEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-[24px] border border-border/70 bg-background/76 p-4"
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
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}



