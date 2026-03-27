import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BadgeDollarSign,
  Link2,
  Package2,
  ReceiptText,
  TicketPercent,
  Users2,
} from "lucide-react";

import { CampaignForm } from "@/components/forms/campaign-form";
import { PromoAssetForm } from "@/components/forms/promo-asset-form";
import { PromoCodeAdminForm } from "@/components/forms/promo-code-admin-form";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricTile } from "@/components/shared/metric-tile";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { formatCommissionRule, formatCurrency, formatShortDate } from "@/lib/utils";

type CampaignDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminCampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = await params;
  const [
    campaigns,
    affiliates,
    links,
    promoCodes,
    assets,
    conversions,
    suspiciousEvents,
    overview,
    catalogItems,
  ] = await Promise.all([
    getRepository().listCampaigns(),
    getRepository().listInfluencers(),
    getRepository().listReferralLinks(),
    getRepository().listPromoCodes("all"),
    getRepository().listPromoAssets(),
    getRepository().listConversions(),
    getRepository().listSuspiciousEvents("all"),
    getRepository().getAdminOverview(),
    getRepository().listStoreCatalogItems(),
  ]);

  const campaign = campaigns.find((item) => item.id === id);

  if (!campaign) {
    notFound();
  }

  const assignedAffiliates = campaign.appliesToAll
    ? affiliates
    : affiliates.filter((affiliate) => campaign.affiliateIds.includes(affiliate.id));
  const campaignLinks = links.filter((link) => link.campaignId === campaign.id);
  const campaignCodes = promoCodes.filter((promoCode) => promoCode.campaignId === campaign.id);
  const campaignAssets = assets.filter((asset) => asset.campaignId === campaign.id);
  const campaignDestination =
    catalogItems.find((item) => item.destinationUrl === campaign.landingUrl) ?? null;
  const campaignConversions = conversions.filter(
    (conversion) => conversion.campaignName === campaign.name,
  );
  const relatedCodes = new Set(campaignCodes.map((promoCode) => promoCode.code));
  const relatedLinks = new Set(campaignLinks.map((link) => link.code));
  const campaignSuspiciousEvents = suspiciousEvents.filter(
    (event) =>
      (event.promoCode && relatedCodes.has(event.promoCode)) ||
      (event.referralCode && relatedLinks.has(event.referralCode)),
  );
  const totals = campaignConversions.reduce(
    (accumulator, conversion) => {
      accumulator.revenue += conversion.orderAmount;
      accumulator.commission += conversion.commissionAmount;
      accumulator.pending += conversion.status === "pending" ? conversion.commissionAmount : 0;
      accumulator.approved += conversion.status === "approved" ? conversion.commissionAmount : 0;
      accumulator.paid += conversion.status === "paid" ? conversion.commissionAmount : 0;
      accumulator.cancelled += conversion.status === "cancelled" ? conversion.orderAmount : 0;
      return accumulator;
    },
    { revenue: 0, commission: 0, pending: 0, approved: 0, paid: 0, cancelled: 0 },
  );
  const affiliatePerformance = Object.values(
    campaignConversions.reduce<
      Record<
        string,
        {
          influencerId: string;
          influencerName: string;
          revenue: number;
          commission: number;
          conversions: number;
        }
      >
    >((accumulator, conversion) => {
      const current = accumulator[conversion.influencerId] ?? {
        influencerId: conversion.influencerId,
        influencerName: conversion.influencerName,
        revenue: 0,
        commission: 0,
        conversions: 0,
      };

      current.revenue += conversion.orderAmount;
      current.commission += conversion.commissionAmount;
      current.conversions += 1;
      accumulator[conversion.influencerId] = current;
      return accumulator;
    }, {}),
  ).sort((left, right) => right.revenue - left.revenue);

  return (
    <div className="space-y-6">
      <section className="ui-section-split ui-section-split-sidebar">
      <Card className="surface-admin">
          <CardContent className="p-7 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="ui-surface-overline">
                  Cabina di regia campagna
                </div>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight">{campaign.name}</h2>
                <p className="mt-3 text-sm leading-7 ui-surface-copy">{campaign.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge
                    status={campaign.status}
                    className="ui-surface-status"
                  />
                  <div className="ui-surface-pill">
                    {campaign.appliesToAll ? "Tutti gli affiliati" : "Assegnazione selettiva"}
                  </div>
                  <div className="ui-surface-pill">
                    {formatCommissionRule(campaign.commissionType, campaign.commissionValue)}
                  </div>
                </div>
              </div>
              <div className="ui-hero-aside grid gap-3 sm:grid-cols-2">
                <MetricTile
                  label="Fatturato influenzato"
                  value={formatCurrency(totals.revenue)}
                  tone="surface"
                  valueSize="md"
                  density="hero"
                />
                <MetricTile
                  label="Liability approvata"
                  value={formatCurrency(totals.approved)}
                  tone="surface"
                  valueSize="md"
                  density="hero"
                />
                <MetricTile
                  label="Affiliati assegnati"
                  value={String(assignedAffiliates.length)}
                  tone="surface"
                  valueSize="md"
                  density="hero"
                />
                <MetricTile
                  label="Flag aperti"
                  value={String(campaignSuspiciousEvents.filter((event) => event.status === "open").length)}
                  tone="surface"
                  valueSize="md"
                  density="hero"
                />
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <a href={campaign.landingUrl} target="_blank" rel="noreferrer">
                  Apri landing
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="ui-surface-action"
              >
                <Link href="/admin/campaigns">Torna alle campagne</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="ui-surface-action"
              >
                <Link href={`/admin/conversions?campaign=${campaign.id}`}>
                  Apri ledger campagna
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Salute campagna</CardTitle>
            <p className="text-sm text-muted-foreground">
              Controlla finestra attiva, esposizione finanziaria e copertura risorse prima di modificare il pacchetto.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricTile
              label="Finestra"
              value={`${formatShortDate(campaign.startDate)} - ${formatShortDate(campaign.endDate)}`}
              hint={`Landing: ${campaignDestination?.title ?? "URL storefront personalizzato"}`}
              tone="muted"
              valueSize="sm"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricTile
                label="Pacchetto risorse"
                value={`${campaignAssets.length} asset`}
                hint={`${campaignCodes.length} codici`}
                tone="default"
                valueSize="sm"
                  density="compact"
                  className="ui-mini-metric"
              />
              <MetricTile
                label="Stato finanziario"
                value={`${campaignConversions.length} conversioni`}
                hint={formatCurrency(totals.commission)}
                tone="default"
                valueSize="sm"
                  density="compact"
                  className="ui-mini-metric"
              />
            </div>
            {campaign.bonusTitle ? (
              <MetricTile
                label="Pacchetto reward"
                value={campaign.bonusTitle}
                hint={campaign.bonusDescription ?? "Reward campagna configurato."}
                tone="default"
                valueSize="sm"
              />
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Affiliati assegnati"
          value={String(assignedAffiliates.length)}
          hint={campaign.appliesToAll ? "Copertura su tutto il programma" : "Copertura selettiva"}
          icon={Users2}
        />
        <StatCard
          label="Link attivi"
          value={String(campaignLinks.filter((link) => link.isActive).length)}
          hint={`${campaignLinks.length} link totali`}
          icon={Link2}
        />
        <StatCard
          label="Codici promo"
          value={String(campaignCodes.length)}
          hint="Codici collegati a questa campagna"
          icon={TicketPercent}
        />
        <StatCard
          label="In revisione"
          value={formatCurrency(totals.pending)}
          hint="Commissioni in attesa di approvazione"
          icon={ReceiptText}
        />
        <StatCard
          label="Approvate"
          value={formatCurrency(totals.approved)}
          hint="Pronte per le operazioni payout"
          icon={BadgeDollarSign}
        />
        <StatCard
          label="Pagate"
          value={formatCurrency(totals.paid)}
          hint={`${formatCurrency(totals.cancelled)} ricavi annullati`}
          icon={BadgeDollarSign}
          emphasis
        />
      </section>

      <section className="ui-section-split ui-section-split-balanced">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Modifica pacchetto campagna</CardTitle>
            <p className="text-sm text-muted-foreground">
              Aggiorna stato, finestra date, URL landing, override commissioni, reward e assegnazione da un&apos;unica vista merchant.
            </p>
          </CardHeader>
          <CardContent>
            <CampaignForm
              allowedDestinations={overview.programSettings.allowedDestinationUrls}
              influencers={affiliates.map((affiliate) => ({
                id: affiliate.id,
                fullName: affiliate.fullName,
              }))}
              initialValues={{
                id: campaign.id,
                name: campaign.name,
                description: campaign.description,
                landingUrl: campaign.landingUrl,
                startDate: campaign.startDate,
                endDate: campaign.endDate,
                status: campaign.status,
                commissionType: campaign.commissionType ?? "default",
                commissionValue: campaign.commissionValue,
                bonusTitle: campaign.bonusTitle ?? "",
                bonusDescription: campaign.bonusDescription ?? "",
                bonusType: campaign.bonusType,
                bonusValue: campaign.bonusValue,
                appliesToAll: campaign.appliesToAll,
                affiliateIds: campaign.affiliateIds,
              }}
              mode="edit"
              submitLabel="Salva campagna"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Operazioni pacchetto campagna</CardTitle>
            <p className="text-sm text-muted-foreground">
              Collega risorse, assegna codici e mantieni operativa la distribuzione a livello campagna.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="ui-panel-block">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Package2 className="size-4" />
                Collega asset alla campagna
              </div>
              <div className="mt-4">
                <PromoAssetForm
                  campaigns={[{ id: campaign.id, name: campaign.name }]}
                  defaultCampaignId={campaign.id}
                  hideCampaignField
                  triggerLabel="Collega asset"
                />
              </div>
            </div>
            <div className="ui-panel-block">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <TicketPercent className="size-4" />
                Assegna codice promo campagna
              </div>
              <div className="mt-4">
                <PromoCodeAdminForm
                  influencers={assignedAffiliates.map((affiliate) => ({
                    id: affiliate.id,
                    fullName: affiliate.fullName,
                  }))}
                  campaigns={[{ id: campaign.id, name: campaign.name }]}
                  defaultCampaignId={campaign.id}
                  hideCampaignField
                />
              </div>
            </div>
            <div className="ui-surface-panel">
              <div className="ui-surface-overline text-muted-foreground">
                Lettura merchant
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {campaign.appliesToAll
                  ? "Questa campagna e attualmente distribuita su tutto il programma."
                  : "Questa campagna e assegnata in modo selettivo e va mantenuta con uno scope controllato."}
              </div>
              {campaignDestination ? (
                <div className="mt-3 text-sm text-muted-foreground">
                  Tipo destinazione Shopify: {campaignDestination.type}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">{assignedAffiliates.length} affiliati</Badge>
                <Badge variant="outline">{campaignAssets.length} asset</Badge>
                <Badge variant="outline">{campaignCodes.length} codici promo</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="ui-section-split ui-section-split-balanced">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Assegnazione affiliati</CardTitle>
            <p className="text-sm text-muted-foreground">
              Quali affiliati stanno spingendo questa campagna e quale impatto stanno generando.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignedAffiliates.length ? (
              assignedAffiliates.map((affiliate) => {
                const performance = affiliatePerformance.find(
                  (item) => item.influencerId === affiliate.id,
                );

                return (
                <div key={affiliate.id} className="ui-record-card">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-medium">{affiliate.fullName}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {affiliate.primaryPlatform} / {affiliate.country ?? "Paese non specificato"}
                        </div>
                      </div>
                      <StatusBadge status={affiliate.isActive ? "active" : "disabled"} />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <MetricTile
                        label="Ricavi"
                        value={formatCurrency(performance?.revenue ?? 0)}
                        tone="default"
                        valueSize="sm"
                        density="compact"
                        className="ui-mini-metric"
                      />
                      <MetricTile
                        label="Conversioni"
                        value={String(performance?.conversions ?? 0)}
                        tone="default"
                        valueSize="sm"
                        density="compact"
                        className="ui-mini-metric"
                      />
                      <MetricTile
                        label="Commissioni"
                        value={formatCurrency(performance?.commission ?? 0)}
                        tone="default"
                        valueSize="sm"
                        density="compact"
                        className="ui-mini-metric"
                      />
                    </div>
                    <div className="mt-4">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/affiliates/${affiliate.id}`}>Apri affiliato</Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                icon={Users2}
                title="Nessun affiliato assegnato"
                description="Aggiorna l&apos;assegnazione della campagna per collegare affiliati prima di attivare risorse e regole commissionali."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Impatto finanziario</CardTitle>
            <p className="text-sm text-muted-foreground">
              Leggi la campagna come un pacchetto finanziario vivo, non solo come un oggetto di setup.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetricTile
                label="Commissioni in revisione"
                value={formatCurrency(totals.pending)}
                tone="muted"
                valueSize="md"
                density="compact"
              />
              <MetricTile
                label="Commissioni approvate"
                value={formatCurrency(totals.approved)}
                tone="default"
                valueSize="md"
                density="compact"
              />
              <MetricTile
                label="Commissioni pagate"
                value={formatCurrency(totals.paid)}
                tone="default"
                valueSize="md"
                density="compact"
              />
              <MetricTile
                label="Flag aperti"
                value={String(campaignSuspiciousEvents.filter((event) => event.status === "open").length)}
                tone="default"
                valueSize="md"
                density="compact"
              />
            </div>
            <div className="ui-panel-block">
              <div className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Salute campagna
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {campaign.status === "active" ? (
                  <Badge variant="secondary">Campagna live merchant</Badge>
                ) : null}
                {campaignConversions.length === 0 ? (
                  <Badge variant="outline">Nessun ordine attribuito</Badge>
                ) : null}
                {campaignAssets.length === 0 ? (
                  <Badge variant="outline">Servono asset</Badge>
                ) : null}
                {campaignCodes.length === 0 ? (
                  <Badge variant="outline">Servono codici promo</Badge>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="ui-section-split ui-section-split-balanced">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Asset e codici promo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Risorse creative e distribuzione coupon attualmente collegate a questa campagna.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaignAssets.length ? (
              campaignAssets.map((asset) => (
                <div key={asset.id} className="ui-panel-block">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{asset.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{asset.description}</div>
                    </div>
                    <PromoAssetForm
                      asset={asset}
                      campaigns={[{ id: campaign.id, name: campaign.name }]}
                      defaultCampaignId={campaign.id}
                      hideCampaignField
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="ui-panel-block border-dashed text-sm text-muted-foreground">
                Nessun asset e attualmente collegato a questa campagna.
              </div>
            )}

            {campaignCodes.length ? (
              campaignCodes.map((promoCode) => (
                <div key={promoCode.id} className="ui-panel-block">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{promoCode.code}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {promoCode.influencerName} / {promoCode.discountValue}% di sconto
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {promoCode.conversions} conversioni / {formatCurrency(promoCode.revenue)} ricavi
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={promoCode.status} />
                      <StatusBadge status={promoCode.source} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="ui-panel-block border-dashed text-sm text-muted-foreground">
                Nessun codice promo specifico per questa campagna.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Link, ledger e rischio</CardTitle>
            <p className="text-sm text-muted-foreground">
              Comportamento delle destinazioni, ordini attribuiti e segnali sospetti collegati a questa campagna.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaignLinks.length ? (
              campaignLinks.map((link) => (
                <div key={link.id} className="ui-panel-block">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{link.name}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {link.influencerName} / {link.clicks} click / {link.conversions} conversioni
                      </div>
                      <div className="ui-wrap-anywhere mt-1 text-sm text-muted-foreground">
                        {link.destinationUrl}
                      </div>
                    </div>
                    <StatusBadge status={link.isActive ? "active" : "inactive"} />
                  </div>
                </div>
              ))
            ) : (
              <div className="ui-panel-block border-dashed text-sm text-muted-foreground">
                Nessun link specifico per questa campagna.
              </div>
            )}

            {campaignConversions.length ? (
              campaignConversions.slice(0, 6).map((conversion) => (
                <div key={conversion.id} className="ui-panel-block">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{conversion.orderId}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {conversion.influencerName} / {formatCurrency(conversion.orderAmount)} ordine
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {formatCurrency(conversion.commissionAmount)} commissione
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={conversion.status} />
                      {conversion.isAllocated ? <Badge variant="outline">In payout</Badge> : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="ui-panel-block border-dashed text-sm text-muted-foreground">
                Nessuna conversione e ancora attribuita a questa campagna.
              </div>
            )}

            {campaignSuspiciousEvents.length ? (
              campaignSuspiciousEvents.map((event) => (
                <div key={event.id} className="ui-panel-block">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {event.influencerName} / {event.detail}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={event.severity} />
                      <StatusBadge status={event.status} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="ui-panel-block border-dashed text-sm text-muted-foreground">
                Nessun evento sospetto e attualmente collegato a questa campagna.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
