import Link from "next/link";

import { BadgeDollarSign, ReceiptText, ShieldAlert, Wallet } from "lucide-react";

import { ConversionForm } from "@/components/forms/conversion-form";
import { AutoGrid } from "@/components/shared/auto-grid";
import { FilterChipLink } from "@/components/shared/filter-chip-link";
import { MetricTile } from "@/components/shared/metric-tile";
import { SectionSplit } from "@/components/shared/section-split";
import { StatCard } from "@/components/shared/stat-card";
import { ConversionsTable } from "@/components/tables/conversions-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { buildPathWithQuery, formatCurrency, formatUiLabel } from "@/lib/utils";

type AdminConversionsPageProps = {
  searchParams?: Promise<{
    status?: string;
    affiliate?: string;
    campaign?: string;
    attribution?: string;
    payout?: string;
  }>;
};

export default async function AdminConversionsPage({
  searchParams,
}: AdminConversionsPageProps) {
  const params = (await searchParams) ?? {};
  const [influencers, conversions, referralLinks, promoCodes, campaigns] = await Promise.all([
    getRepository().listInfluencers(),
    getRepository().listConversions(),
    getRepository().listReferralLinks(),
    getRepository().listPromoCodes("all"),
    getRepository().listCampaigns(),
  ]);

  const buildHref = (overrides: Record<string, string>) => {
    return buildPathWithQuery("/admin/conversions", {
      status: params.status ?? "all",
      affiliate: params.affiliate ?? "all",
      campaign: params.campaign ?? "all",
      attribution: params.attribution ?? "all",
      payout: params.payout ?? "all",
      ...overrides,
    });
  };

  const filtered = conversions.filter((conversion) => {
    const matchesStatus =
      !params.status || params.status === "all" || conversion.status === params.status;
    const matchesAffiliate =
      !params.affiliate ||
      params.affiliate === "all" ||
      conversion.influencerId === params.affiliate;
    const matchesCampaign =
      !params.campaign ||
      params.campaign === "all" ||
      campaigns.some(
        (campaign) =>
          campaign.id === params.campaign && campaign.name === conversion.campaignName,
      );
    const matchesAttribution =
      !params.attribution ||
      params.attribution === "all" ||
      conversion.attributionSource === params.attribution;
    const matchesPayout =
      !params.payout ||
      params.payout === "all" ||
      (params.payout === "allocated" ? conversion.isAllocated : !conversion.isAllocated);

    return (
      matchesStatus &&
      matchesAffiliate &&
      matchesCampaign &&
      matchesAttribution &&
      matchesPayout
    );
  });

  const totals = filtered.reduce(
    (accumulator, conversion) => {
      accumulator.revenue += conversion.orderAmount;
      accumulator.commission += conversion.commissionAmount;
      accumulator.pending += conversion.status === "pending" ? conversion.commissionAmount : 0;
      accumulator.approved += conversion.status === "approved" ? conversion.commissionAmount : 0;
      accumulator.approvedAllocated +=
        conversion.status === "approved" && conversion.isAllocated
          ? conversion.commissionAmount
          : 0;
      accumulator.approvedAvailable +=
        conversion.status === "approved" && !conversion.isAllocated
          ? conversion.commissionAmount
          : 0;
      accumulator.paid += conversion.status === "paid" ? conversion.commissionAmount : 0;
      accumulator.cancelledRevenue +=
        conversion.status === "cancelled" ? conversion.orderAmount : 0;
      accumulator.openFlags += conversion.suspiciousEventsCount;
      return accumulator;
    },
    {
      revenue: 0,
      commission: 0,
      pending: 0,
      approved: 0,
      approvedAllocated: 0,
      approvedAvailable: 0,
      paid: 0,
      cancelledRevenue: 0,
      openFlags: 0,
    },
  );

  const affiliateExposure = Object.values(
    filtered.reduce<
      Record<
        string,
        {
          influencerName: string;
          commission: number;
          allocated: number;
          revenue: number;
          conversions: number;
        }
      >
    >((accumulator, conversion) => {
      const current = accumulator[conversion.influencerName] ?? {
        influencerName: conversion.influencerName,
        commission: 0,
        allocated: 0,
        revenue: 0,
        conversions: 0,
      };

      current.commission +=
        conversion.status === "approved" && !conversion.isAllocated
          ? conversion.commissionAmount
          : 0;
      current.allocated +=
        conversion.status === "approved" && conversion.isAllocated
          ? conversion.commissionAmount
          : 0;
      current.revenue += conversion.orderAmount;
      current.conversions += 1;
      accumulator[conversion.influencerName] = current;
      return accumulator;
    }, {}),
  )
    .sort((left, right) => right.commission - left.commission)
    .slice(0, 5);

  const campaignExposure = Object.values(
    filtered.reduce<
      Record<
        string,
        {
          campaignName: string;
          revenue: number;
          commission: number;
          conversions: number;
        }
      >
    >((accumulator, conversion) => {
      const key = conversion.campaignName ?? "Nessuna campagna";
      const current = accumulator[key] ?? {
        campaignName: key,
        revenue: 0,
        commission: 0,
        conversions: 0,
      };

      current.revenue += conversion.orderAmount;
      current.commission += conversion.commissionAmount;
      current.conversions += 1;
      accumulator[key] = current;
      return accumulator;
    }, {}),
  )
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, 5);

  return (
    <div className="ui-page-stack">
      <Card className="ui-card-hero">
        <CardContent className="p-6">
          <div className="ui-surface-overline text-muted-foreground">
            Ledger commissioni
          </div>
          <h2 className="ui-page-title mt-4">
            Traccia ogni ordine attribuito dallo stato conversione fino all&apos;esposizione commissionale.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted-foreground">
            Questo ledger è la vista merchant dell&apos;attribuzione ordini. Deve chiarire cosa è ancora
            in revisione, cosa è approvato e dovuto, cosa è già stato pagato e quale affiliato o
            campagna sta generando la liability corrente.
          </p>
        </CardContent>
      </Card>

      <Card className="ui-card-soft ui-toolbar-card">
        <CardContent className="ui-toolbar-content">
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary">Conversioni visibili: {filtered.length}</Badge>
            <Badge variant="outline">Stato: {params.status ?? "all"}</Badge>
            <Badge variant="outline">Affiliato: {params.affiliate ?? "all"}</Badge>
            <Badge variant="outline">Campagna: {params.campaign ?? "all"}</Badge>
            <Badge variant="outline">Attribuzione: {params.attribution ?? "all"}</Badge>
            <Badge variant="outline">Payout: {params.payout ?? "all"}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "approved", "paid", "cancelled"].map((status) => (
              <FilterChipLink
                key={status}
                href={buildHref({ status })}
              >
                {formatUiLabel(status)}
              </FilterChipLink>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "link", "promo_code", "hybrid", "manual"].map((attribution) => (
              <FilterChipLink
                key={attribution}
                href={buildHref({ attribution })}
              >
                {formatUiLabel(attribution)}
              </FilterChipLink>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Tutti gli stati payout", value: "all" },
              { label: "Allocati", value: "allocated" },
              { label: "Non allocati", value: "available" },
            ].map((item) => (
              <FilterChipLink
                key={item.value}
                href={buildHref({ payout: item.value })}
              >
                {item.label}
              </FilterChipLink>
            ))}
          </div>
        </CardContent>
      </Card>

      <AutoGrid minItemWidth="12rem" gap="md">
        <StatCard
          label="Ordini registrati"
          value={String(filtered.length)}
          hint={`${totals.openFlags} indicatori di rischio aperti`}
          icon={ReceiptText}
        />
        <StatCard
          label="Volume ordini"
          value={formatCurrency(totals.revenue)}
          hint="Ricavi lordi attribuiti"
          icon={BadgeDollarSign}
        />
        <StatCard
          label="In revisione"
          value={formatCurrency(totals.pending)}
          hint="Commissioni in attesa di approvazione"
          icon={ShieldAlert}
        />
        <StatCard
          label="Pronte per payout"
          value={formatCurrency(totals.approvedAvailable)}
          hint={formatCurrency(totals.approvedAllocated) + " già allocati"}
          icon={Wallet}
        />
        <StatCard
          label="Commissioni pagate"
          value={formatCurrency(totals.paid)}
          hint={`${formatCurrency(totals.cancelledRevenue)} ricavi annullati`}
          icon={Wallet}
          emphasis
        />
      </AutoGrid>

      <SectionSplit
        variant="balanced"
        primary={
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Pipeline ledger</CardTitle>
              <p className="text-sm text-muted-foreground">
                Usa questi importi per capire cosa richiede ancora revisione e cosa può entrare nei payout.
              </p>
            </CardHeader>
            <CardContent>
              <AutoGrid minItemWidth="11rem" gap="md">
                <MetricTile
                  label="In revisione"
                  value={formatCurrency(totals.pending)}
                  hint="Conversioni che richiedono ancora approvazione merchant."
                  tone="muted"
                  valueSize="md"
                  density="compact"
                />
                <MetricTile
                  label="Approvate e aperte"
                  value={formatCurrency(totals.approvedAvailable)}
                  hint="Commissioni che possono ancora entrare in un nuovo payout batch."
                  tone="default"
                  valueSize="md"
                  density="compact"
                />
                <MetricTile
                  label="Già allocati"
                  value={formatCurrency(totals.approvedAllocated)}
                  hint="Commissioni approvate già collegate a record di payout."
                  tone="default"
                  valueSize="md"
                  density="compact"
                />
                <MetricTile
                  label="Pagate"
                  value={formatCurrency(totals.paid)}
                  hint="Commissioni già segnate come liquidate nel ledger."
                  tone="default"
                  valueSize="md"
                  density="compact"
                />
              </AutoGrid>
            </CardContent>
          </Card>
        }
        secondary={
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Esposizione approvata più alta</CardTitle>
              <p className="text-sm text-muted-foreground">
                Affiliati che stanno accumulando la maggiore commissione approvata ancora disponibile per il payout.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {affiliateExposure.length ? (
                affiliateExposure.map((item) => {
                  const influencer = influencers.find(
                    (candidate) => candidate.fullName === item.influencerName,
                  );

                  return (
                    <div key={item.influencerName} className="ui-surface-panel">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">{item.influencerName}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {item.conversions} conversioni · {formatCurrency(item.revenue)} ricavi
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(item.commission)}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {formatCurrency(item.allocated)} già allocati
                          </div>
                          {influencer ? (
                            <Link
                              href={`/admin/affiliates/${influencer.id}`}
                              className="mt-1 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
                            >
                              Apri affiliato
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="ui-surface-panel border-dashed text-sm text-muted-foreground">
                  Nessuna esposizione approvata nel set di filtri corrente.
                </div>
              )}
            </CardContent>
          </Card>
        }
      />

      <SectionSplit
        variant="balanced"
        primary={
          <Card>
            <CardHeader>
              <CardTitle>Registra conversione manuale</CardTitle>
              <p className="text-sm text-muted-foreground">
                Usa questo inserimento per backfill operativo, riconciliazione o verifiche puntuali senza uscire dal ledger.
              </p>
            </CardHeader>
            <CardContent>
              <ConversionForm
                influencers={influencers}
                referralLinks={referralLinks}
                promoCodes={promoCodes}
                defaultInfluencerId={params.affiliate && params.affiliate !== "all" ? params.affiliate : undefined}
                hideInfluencerField={Boolean(params.affiliate && params.affiliate !== "all")}
              />
            </CardContent>
          </Card>
        }
        secondary={
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Mix attribuzione campagne</CardTitle>
              <p className="text-sm text-muted-foreground">
                Vedi quali campagne stanno producendo ricavi e quali record restano fuori dallo scope campagna.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaignExposure.length ? (
                campaignExposure.map((item) => {
                  const campaign = campaigns.find(
                    (candidate) => candidate.name === item.campaignName,
                  );

                  return (
                    <div key={item.campaignName} className="ui-surface-panel">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">{item.campaignName}</div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {item.conversions} conversioni · {formatCurrency(item.commission)} commissioni
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(item.revenue)}</div>
                          {campaign ? (
                            <Link
                              href={`/admin/campaigns/${campaign.id}`}
                              className="mt-1 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
                            >
                              Apri campagna
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="ui-surface-panel border-dashed text-sm text-muted-foreground">
                  Nessuna attribuzione campagna nel filtro corrente.
                </div>
              )}
            </CardContent>
          </Card>
        }
      />

      <ConversionsTable data={filtered} />
    </div>
  );
}



