import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  Building2,
  Link2,
  Megaphone,
  ReceiptText,
  TicketPercent,
  Wallet,
} from "lucide-react";

import { ConversionForm } from "@/components/forms/conversion-form";
import { InfluencerAdminForm } from "@/components/forms/influencer-admin-form";
import { ManualSuspiciousEventForm } from "@/components/forms/manual-suspicious-event-form";
import { PayoutUpdateForm } from "@/components/forms/payout-update-form";
import { PromoCodeAdminForm } from "@/components/forms/promo-code-admin-form";
import { ReferralLinkStatusForm } from "@/components/forms/referral-link-status-form";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricTile } from "@/components/shared/metric-tile";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { SuspiciousEventReviewForm } from "@/components/forms/suspicious-event-review-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import {
  createAbsoluteUrl,
  formatCurrency,
  formatPercent,
  formatShortDate,
  formatUiLabel,
  timeAgo,
} from "@/lib/utils";

type AffiliateDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminAffiliateDetailPage({
  params,
}: AffiliateDetailPageProps) {
  const { id } = await params;
  const data = await getRepository().getAffiliateDetail(id);

  if (!data) {
    notFound();
  }

  const pendingCommission = data.conversions
    .filter((conversion) => conversion.status === "pending")
    .reduce((sum, conversion) => sum + conversion.commissionAmount, 0);
  const approvedCommission = data.conversions
    .filter((conversion) => conversion.status === "approved")
    .reduce((sum, conversion) => sum + conversion.commissionAmount, 0);
  const paidCommission = data.conversions
    .filter((conversion) => conversion.status === "paid")
    .reduce((sum, conversion) => sum + conversion.commissionAmount, 0);
  const cancelledRevenue = data.conversions
    .filter((conversion) => conversion.status === "cancelled")
    .reduce((sum, conversion) => sum + conversion.orderAmount, 0);
  const openRiskCount = data.suspiciousEvents.filter((event) => event.status === "open").length;
  const activeCampaigns = data.campaigns.filter((campaign) => campaign.status === "active").length;
  const primaryLink = data.influencer.primaryReferralLink
    ? createAbsoluteUrl(`/r/${data.influencer.primaryReferralLink.code}`)
    : null;
  const latestPayout = data.payouts[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
      <Card className="surface-admin">
          <CardContent className="p-7 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="text-[11px] font-semibold tracking-[0.18em] text-white/72 uppercase">
                  Command center affiliato
                </div>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                  {data.influencer.fullName}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/76">
                  Gestisci questo affiliato come un vero profilo merchant: modello commissionale,
                  readiness payout, copertura campagne, codici, link, stato ledger e revisione rischio
                  da un unico punto operativo.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge
                    status={data.influencer.isActive ? "active" : "disabled"}
                    className="border-white/15 bg-white/10 text-white"
                  />
                  <StatusBadge
                    status={data.influencer.applicationStatus}
                    className="border-white/15 bg-white/10 text-white"
                  />
                  <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/72">
                    {formatUiLabel(data.influencer.primaryPlatform)} · {data.influencer.audienceSize}
                  </div>
                  <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/72">
                    {data.influencer.country ?? "Paese non specificato"}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
                <MetricTile
                  label="Codice principale"
                  value={data.influencer.discountCode}
                  tone="surface"
                  valueSize="md"
                  className="min-h-[126px]"
                />
                <MetricTile
                  label="Modello commissione"
                  value={
                    data.influencer.commissionType === "percentage"
                      ? `${data.influencer.commissionValue}%`
                      : formatCurrency(data.influencer.commissionValue)
                  }
                  tone="surface"
                  valueSize="md"
                  className="min-h-[126px]"
                />
                <MetricTile
                  label="Metodo payout"
                  value={
                    data.influencer.payoutMethod
                      ? formatUiLabel(data.influencer.payoutMethod)
                      : "Manuale"
                  }
                  tone="surface"
                  valueSize="sm"
                  className="min-h-[126px]"
                  valueClassName="capitalize"
                />
                <MetricTile
                  label="Ultima attivita"
                  value={
                    data.influencer.lastActivityAt
                      ? timeAgo(data.influencer.lastActivityAt)
                      : "Nessuna attivita"
                  }
                  tone="surface"
                  valueSize="sm"
                  className="min-h-[126px]"
                />
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              {primaryLink ? (
                <CopyButton
                  value={primaryLink}
                  label="Referral link principale"
                  className="border-white/15 bg-white/8 text-white hover:bg-white/14 hover:text-white"
                />
              ) : null}
              <CopyButton
                value={data.influencer.discountCode}
                label="Codice promo principale"
                className="border-white/15 bg-white/8 text-white hover:bg-white/14 hover:text-white"
              />
              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-white/8 text-white hover:bg-white/14 hover:text-white"
              >
                <Link href={`/admin/conversions?affiliate=${data.influencer.id}`}>
                  Vedi ledger
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-white/8 text-white hover:bg-white/14 hover:text-white"
              >
                <Link href={`/admin/codes?affiliate=${data.influencer.id}`}>
                  Codici promo
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Controlli merchant</CardTitle>
            <p className="text-sm text-muted-foreground">
              Aggiorna stato, commissione, campi payout e note interne senza uscire da questo profilo.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[24px] border border-border/70 bg-muted/65 p-4">
              <div className="text-sm text-muted-foreground">{data.influencer.email}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusBadge status={data.influencer.payoutProviderStatus} />
                <div className="text-sm text-muted-foreground">
                  {data.influencer.payoutEmail ?? "Nessuna email payout configurata"}
                </div>
              </div>
            </div>
            {data.influencer.notes ? (
              <div className="rounded-[24px] border border-border/70 bg-background/76 p-4">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Note interne
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {data.influencer.notes}
                </p>
              </div>
            ) : null}
            {data.application ? (
              <div className="rounded-[24px] border border-border/70 bg-background/76 p-4">
                <div className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                  Contesto candidatura
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {data.application.message}
                </p>
                {data.application.reviewNotes ? (
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Note revisione: {data.application.reviewNotes}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <InfluencerAdminForm influencer={data.influencer} />
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/payouts?affiliate=${data.influencer.id}`}>Apri payout</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Click"
          value={String(data.influencer.stats.clicks)}
          hint="Traffico referral tracciato"
          icon={ArrowUpRight}
        />
        <StatCard
          label="Conversioni"
          value={String(data.influencer.stats.conversions)}
          hint={`${formatPercent(data.influencer.stats.conversionRate)} tasso di conversione`}
          icon={ReceiptText}
        />
        <StatCard
          label="Ricavi"
          value={formatCurrency(data.influencer.stats.totalRevenue)}
          hint="Valore ordini attribuito"
          icon={BadgeDollarSign}
        />
        <StatCard
          label="Liability approvata"
          value={formatCurrency(approvedCommission)}
          hint="Commissioni approvate e non ancora pagate"
          icon={Wallet}
        />
        <StatCard
          label="Flag rischio aperti"
          value={String(openRiskCount)}
          hint={`${activeCampaigns} campagne attive`}
          icon={AlertTriangle}
          emphasis
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Pipeline finanziaria</CardTitle>
            <p className="text-sm text-muted-foreground">
              Capisci subito dove si trova questo affiliato, dall&apos;approvazione conversioni fino al payout.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricTile
                label="In revisione"
                value={formatCurrency(pendingCommission)}
                hint="Commissioni da conversioni ancora da approvare"
                tone="muted"
                valueSize="md"
              />
              <MetricTile
                label="Approvate"
                value={formatCurrency(approvedCommission)}
                hint="Pronte per entrare nelle operazioni payout"
                tone="default"
                valueSize="md"
              />
              <MetricTile
                label="Commissioni pagate"
                value={formatCurrency(paidCommission)}
                hint="Commissioni gia liquidate"
                tone="default"
                valueSize="md"
              />
              <MetricTile
                label="Ricavi annullati"
                value={formatCurrency(cancelledRevenue)}
                hint="Esclusi dall'esposizione payout"
                tone="default"
                valueSize="md"
              />
            </div>

            <MetricTile
              label="Ultimo record payout"
              value={latestPayout ? formatCurrency(latestPayout.amount) : formatCurrency(0)}
              hint={
                latestPayout
                  ? `${formatShortDate(latestPayout.createdAt)} · ${latestPayout.reference ?? "Riferimento in attesa"}`
                  : "Nessun record payout ancora creato"
              }
              tone="default"
              valueSize="md"
              footer={<StatusBadge status={latestPayout?.status ?? "draft"} />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Azioni dirette merchant</CardTitle>
            <p className="text-sm text-muted-foreground">
              Esegui da qui le attivita operative piu frequenti per questo affiliato.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-[26px] border border-border/70 bg-background/76 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <TicketPercent className="size-4" />
                Assegna codice promo
              </div>
              <div className="mt-4">
                <PromoCodeAdminForm
                  influencers={[
                    {
                      id: data.influencer.id,
                      fullName: data.influencer.fullName,
                    },
                  ]}
                  campaigns={data.campaigns.map((campaign) => ({
                    id: campaign.id,
                    name: campaign.name,
                  }))}
                  defaultInfluencerId={data.influencer.id}
                  hideInfluencerField
                />
              </div>
            </div>

            <div className="rounded-[26px] border border-border/70 bg-background/76 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ReceiptText className="size-4" />
                Registra conversione
              </div>
              <div className="mt-4">
                <ConversionForm
                  influencers={[data.influencer]}
                  referralLinks={data.referralLinks}
                  promoCodes={data.promoCodes}
                  defaultInfluencerId={data.influencer.id}
                  hideInfluencerField
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Referral link</CardTitle>
            <p className="text-sm text-muted-foreground">
              Destinazioni store attive, link live, uso UTM e performance in un unico punto.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.referralLinks.length ? (
              data.referralLinks.map((link) => (
                <div
                  key={link.id}
                  className="rounded-[26px] border border-border/70 bg-background/76 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{link.name}</div>
                        <StatusBadge status={link.isActive ? "active" : "inactive"} />
                        {link.campaignName ? (
                          <Badge variant="outline">{link.campaignName}</Badge>
                        ) : null}
                      </div>
                      <div className="mt-2 truncate text-sm text-muted-foreground">
                        /r/{link.code}
                      </div>
                      <div className="mt-2 truncate text-sm text-muted-foreground">
                        {link.destinationUrl}
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <MetricTile
                          label="Performance click"
                          value={`${link.clicks} click`}
                          hint={`${link.conversions} conversioni`}
                          tone="default"
                          valueSize="sm"
                          className="min-h-[112px] rounded-[20px] bg-white p-3"
                        />
                        <MetricTile
                          label="Valore generato"
                          value={formatCurrency(link.revenue)}
                          hint={`${formatCurrency(link.commission)} commissioni`}
                          tone="default"
                          valueSize="sm"
                          className="min-h-[112px] rounded-[20px] bg-white p-3"
                        />
                      </div>
                      {(link.utmSource || link.utmMedium || link.utmCampaign) ? (
                        <div className="mt-3 text-sm text-muted-foreground">
                          UTM: {[link.utmSource, link.utmMedium, link.utmCampaign].filter(Boolean).join(" / ")}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <CopyButton value={createAbsoluteUrl(`/r/${link.code}`)} label="Link" />
                      <ReferralLinkStatusForm
                        linkId={link.id}
                        isActive={link.isActive}
                        isPrimary={link.isPrimary}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Link2}
                title="Nessun referral link"
                description="Qui compariranno i link quando l&apos;affiliato iniziera a promuovere le destinazioni dello store."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Codici promo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ownership, stato, contesto campagna e performance diretta per ogni codice.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.promoCodes.length ? (
              data.promoCodes.map((promoCode) => (
                <div
                  key={promoCode.id}
                  className="rounded-[26px] border border-border/70 bg-background/76 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{promoCode.code}</div>
                        <StatusBadge status={promoCode.status} />
                        <StatusBadge status={promoCode.source} />
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {promoCode.campaignName ?? "Intero programma"} · {promoCode.discountValue}% di sconto
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <MetricTile
                          label="Conversioni"
                          value={String(promoCode.conversions)}
                          tone="default"
                          valueSize="sm"
                          className="min-h-[108px] rounded-[20px] bg-white p-3"
                        />
                        <MetricTile
                          label="Ricavi"
                          value={formatCurrency(promoCode.revenue)}
                          tone="default"
                          valueSize="sm"
                          className="min-h-[108px] rounded-[20px] bg-white p-3"
                        />
                        <MetricTile
                          label="Commissioni"
                          value={formatCurrency(promoCode.commission)}
                          tone="default"
                          valueSize="sm"
                          className="min-h-[108px] rounded-[20px] bg-white p-3"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <CopyButton value={promoCode.code} label="Codice promo" />
                      {promoCode.suspiciousEventsCount ? (
                        <StatusBadge status={`${promoCode.suspiciousEventsCount} risk`} />
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={TicketPercent}
                title="Nessun codice promo"
                description="Assegna un codice dai controlli merchant qui sopra per attivare l&apos;attribuzione basata su coupon."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Accesso campagne</CardTitle>
            <p className="text-sm text-muted-foreground">
              Cosa puo promuovere oggi questo affiliato e cosa include ogni campagna abilitata.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.campaigns.length ? (
              data.campaigns.map((campaign) => (
                <div key={campaign.id} className="rounded-[26px] border border-border/70 bg-background/76 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {campaign.description}
                      </div>
                    </div>
                    <StatusBadge status={campaign.status} />
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <MetricTile
                      label="Finestra"
                      value={`${formatShortDate(campaign.startDate)} - ${formatShortDate(campaign.endDate)}`}
                      tone="default"
                      valueSize="sm"
                      className="min-h-[112px] rounded-[20px] bg-white p-3"
                    />
                    <MetricTile
                      label="Regola commissionale"
                      value={
                        campaign.commissionType
                          ? `${campaign.commissionValue}${campaign.commissionType === "percentage" ? "%" : ""} ${campaign.commissionType}`
                          : "Commissione default programma"
                      }
                      tone="default"
                      valueSize="sm"
                      className="min-h-[112px] rounded-[20px] bg-white p-3"
                    />
                    <MetricTile
                      label="Distribuzione"
                      value={`${campaign.referralLinks.length} link`}
                      hint={`${campaign.promoCodes.length} codici`}
                      tone="default"
                      valueSize="sm"
                      className="min-h-[112px] rounded-[20px] bg-white p-3"
                    />
                    <MetricTile
                      label="Asset e reward"
                      value={`${campaign.assets.length} asset`}
                      hint={`${campaign.rewards.length} reward`}
                      tone="default"
                      valueSize="sm"
                      className="min-h-[112px] rounded-[20px] bg-white p-3"
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/campaigns/${campaign.id}`}>Apri campagna</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={campaign.landingUrl} target="_blank" rel="noreferrer">
                        Apri landing
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Megaphone}
                title="Nessuna campagna assegnata"
                description="L&apos;assegnazione campagne apparira qui quando questo affiliato verra incluso in una spinta di programma."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Frodi e attivita sospette</CardTitle>
            <p className="text-sm text-muted-foreground">
              Verifica le anomalie prima di approvare conversioni o spostare commissioni nel payout.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ManualSuspiciousEventForm influencerId={data.influencer.id} />
            {data.suspiciousEvents.length ? (
              data.suspiciousEvents.map((event) => (
                <div key={event.id} className="rounded-[24px] border border-border/70 bg-background/76 p-4">
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
                  <div className="mt-4">
                    <SuspiciousEventReviewForm suspiciousEventId={event.id} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={AlertTriangle}
                title="Nessun flag frode"
                description="Questo affiliato non ha eventi sospetti attualmente in revisione."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Ledger conversioni</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tracciabilita ordine per ordine con metodo di attribuzione, contesto campagna e stato commissionale.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.conversions.length ? (
              data.conversions.map((conversion) => (
                <div
                  key={conversion.id}
                  className="rounded-[24px] border border-border/70 bg-background/76 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-medium">{conversion.orderId}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {conversion.campaignName ?? "Nessuna campagna"} · {conversion.attributionLabel}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {conversion.referralCode ? `Link /r/${conversion.referralCode}` : "Nessun link"} ·{" "}
                        {conversion.promoCode ? `Codice ${conversion.promoCode}` : "Nessun codice"}
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <MetricTile
                          label="Ordine"
                          value={formatCurrency(conversion.orderAmount)}
                          tone="default"
                          valueSize="sm"
                          className="min-h-[108px] rounded-[18px] bg-white p-3"
                        />
                        <MetricTile
                          label="Commissione"
                          value={formatCurrency(conversion.commissionAmount)}
                          tone="default"
                          valueSize="sm"
                          className="min-h-[108px] rounded-[18px] bg-white p-3"
                        />
                        <MetricTile
                          label="Registrata il"
                          value={formatShortDate(conversion.createdAt)}
                          tone="default"
                          valueSize="sm"
                          className="min-h-[108px] rounded-[18px] bg-white p-3"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={conversion.status} />
                      {conversion.suspiciousEventsCount ? (
                        <StatusBadge status={`${conversion.suspiciousEventsCount} risk`} />
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={ReceiptText}
                title="Nessuna conversione registrata"
                description="Usa l&apos;azione merchant qui sopra per inserire il primo ordine attribuito di questo affiliato."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Ledger payout</CardTitle>
            <p className="text-sm text-muted-foreground">
              Storico dei record payout con aggiornamenti di stato e riferimenti di pagamento.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.payouts.length ? (
              data.payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="rounded-[24px] border border-border/70 bg-background/76 p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium">{formatCurrency(payout.amount)}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {payout.reference ?? "Riferimento pagamento in attesa"}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Creato il {formatShortDate(payout.createdAt)}
                        {payout.paidAt ? ` · Pagato il ${formatShortDate(payout.paidAt)}` : ""}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <StatusBadge status={payout.status} />
                      <PayoutUpdateForm
                        payout={{
                          ...payout,
                          influencerName: data.influencer.fullName,
                          influencerEmail: data.influencer.email,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Wallet}
                title="Nessun record payout"
                description="Lo storico payout apparira qui quando il merchant spostera le commissioni approvate nelle operazioni di pagamento."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Asset accessibili</CardTitle>
            <p className="text-sm text-muted-foreground">
              Materiali creativi attualmente visibili a questo affiliato via campagna o assegnazione diretta.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.promoAssets.length ? (
              data.promoAssets.map((asset) => (
                <div key={asset.id} className="rounded-[24px] border border-border/70 bg-background/76 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{asset.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{asset.description}</div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <a href={asset.fileUrl} target="_blank" rel="noreferrer">
                        Apri
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Building2}
                title="Nessun asset assegnato"
                description="Gli asset compariranno qui quando verranno collegati via campagna o assegnazione diretta."
              />
            )}
          </CardContent>
        </Card>

        <ActivityFeed items={data.recentActivity} />
      </section>
    </div>
  );
}


