import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BadgeDollarSign,
  Coins,
  Link2,
  Megaphone,
  MousePointerClick,
  ReceiptText,
  TicketPercent,
  Wallet,
} from "lucide-react";

import { PerformanceChart } from "@/components/charts/performance-chart";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { AutoGrid } from "@/components/shared/auto-grid";
import { CopyButton } from "@/components/shared/copy-button";
import { MetricTile } from "@/components/shared/metric-tile";
import { RecordCard } from "@/components/shared/record-card";
import { SectionSplit } from "@/components/shared/section-split";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import {
  createAbsoluteUrl,
  formatCurrency,
  formatPercent,
  formatUiLabel,
} from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireInfluencer();
  const data = await getRepository().getInfluencerDashboard(session.profileId);

  if (!data) {
    notFound();
  }

  const primaryShareLink = createAbsoluteUrl(
    `/r/${data.primaryReferralLink?.code ?? data.influencer.publicSlug}`,
  );
  const activeLinks = data.referralLinks.filter((link) => link.isActive).length;
  const activeCodes = data.promoCodes.filter((promoCode) => promoCode.status === "active").length;
  const activeCampaigns = data.campaigns.filter((campaign) => campaign.status === "active").length;

  return (
    <div className="space-y-6">
      <SectionSplit
        primary={
          <Card className="surface-affiliate overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl">
                  <div className="ui-surface-overline">
                    Area affiliato
                  </div>
                  <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                    {data.profile.fullName}
                  </h2>
                  <p className="mt-3 text-sm leading-7 ui-surface-copy">
                    Qui trovi tutto cio che ti serve per promuoverti al meglio: link attivi, codici
                    promo, materiali di campagna e una vista chiara dei tuoi guadagni.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <StatusBadge status={data.applicationStatus} className="ui-surface-status" />
                    <div className="ui-surface-pill">
                      {data.influencer.commissionValue}
                      {data.influencer.commissionType === "percentage" ? "%" : ""} commissione{" "}
                      {formatUiLabel(data.influencer.commissionType)}
                    </div>
                  </div>
                </div>

                <div className="ui-hero-aside">
                  <AutoGrid minItemWidth="9.5rem">
                    <MetricTile
                      tone="surface"
                      label="Link attivi"
                      value={activeLinks}
                      valueType="metric"
                      density="compact"
                    />
                    <MetricTile
                      tone="surface"
                      label="Codici attivi"
                      value={activeCodes}
                      valueType="metric"
                      density="compact"
                    />
                    <MetricTile
                      tone="surface"
                      label="Campagne live"
                      value={activeCampaigns}
                      valueType="metric"
                      density="compact"
                    />
                    <MetricTile
                      tone="surface"
                      label="Guadagni in attesa"
                      value={formatCurrency(data.stats.pendingCommission)}
                      valueType="metric"
                      density="compact"
                    />
                  </AutoGrid>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="ui-surface-panel p-4 text-[color:var(--surface-copy)]">
                  <div className="ui-surface-overline">
                    Codice promo principale
                  </div>
                  <div className="mt-3 text-4xl font-semibold tracking-tight">
                    {data.influencer.discountCode}
                  </div>
                  <div className="mt-2 text-sm ui-surface-copy">
                    Usalo in caption, stories, note creator e contenuti di campagna.
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <CopyButton
                      value={data.influencer.discountCode}
                      label="Codice promo"
                      variant="surface"
                    />
                    <Button asChild size="sm" variant="surface">
                      <Link href="/dashboard/codes">Gestisci codici</Link>
                    </Button>
                  </div>
                </div>
                <div className="ui-surface-panel p-4 text-[color:var(--surface-copy)]">
                  <div className="ui-surface-overline">
                    Referral link principale
                  </div>
                  <div className="ui-wrap-anywhere mt-3 text-base font-medium ui-surface-copy">
                    {primaryShareLink}
                  </div>
                  <div className="mt-2 text-sm ui-surface-copy">
                    Condividi questo link quando vuoi attribuzione del traffico e reportistica sui
                    click.
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <CopyButton
                      value={primaryShareLink}
                      label="Referral link"
                      variant="surface"
                    />
                    <Button asChild size="sm" variant="surface">
                      <Link href="/dashboard/links">Crea link</Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="secondary">
                  <Link href="/dashboard/links">Crea referral link</Link>
                </Button>
                <Button asChild variant="surface">
                  <Link href="/dashboard/assets">Sfoglia asset</Link>
                </Button>
                <Button asChild variant="surface">
                  <Link href="/dashboard/campaigns">Vedi campagne</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        }
        secondary={
          <Card className="ui-card-soft">
            <CardHeader className="pb-4">
              <CardTitle>Pipeline guadagni</CardTitle>
              <p className="text-sm text-muted-foreground">
                Tieni traccia di quanto hai maturato, di cio che e in attesa di payout e di cio che
                e gia stato liquidato.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricTile
                tone="muted"
                label="Saldo in attesa"
                value={formatCurrency(data.stats.pendingCommission)}
                valueSize="xl"
                valueType="metric"
                density="hero"
              />
              <AutoGrid minItemWidth="10rem" gap="md">
                <MetricTile
                  label="Commissioni pagate"
                  value={formatCurrency(data.stats.paidCommission)}
                  valueSize="md"
                  valueType="metric"
                  density="compact"
                />
                <MetricTile
                  label="Commissioni totali"
                  value={formatCurrency(data.stats.totalCommission)}
                  valueSize="md"
                  valueType="metric"
                  density="compact"
                />
              </AutoGrid>
              <MetricTile
                label="Ultimo payout"
                value={
                  data.latestPayout
                    ? formatCurrency(data.latestPayout.amount)
                    : formatCurrency(0)
                }
                hint={formatUiLabel(data.influencer.payoutMethod ?? "manual")}
                valueSize="md"
                valueType="metric"
                density="default"
                footer={<StatusBadge status={data.latestPayout?.status ?? "draft"} />}
              />
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/settings">Aggiorna impostazioni payout</Link>
              </Button>
            </CardContent>
          </Card>
        }
        asideWidth="23rem"
      />

      <AutoGrid minItemWidth="12rem" gap="md">
        <StatCard
          label="Click"
          value={String(data.stats.clicks)}
          hint="Visite referral tracciate"
          icon={MousePointerClick}
        />
        <StatCard
          label="Conversioni"
          value={String(data.stats.conversions)}
          hint={`${formatPercent(data.stats.conversionRate)} di conversion rate`}
          icon={ReceiptText}
        />
        <StatCard
          label="Fatturato"
          value={formatCurrency(data.stats.totalRevenue)}
          hint="Valore ordini attribuito"
          icon={BadgeDollarSign}
        />
        <StatCard
          label="Commissioni"
          value={formatCurrency(data.stats.totalCommission)}
          hint="Guadagni in attesa + pagati"
          icon={Coins}
          emphasis
        />
      </AutoGrid>

      <SectionSplit
        primary={<PerformanceChart title="Performance ultimi 30 giorni" data={data.performance} />}
        secondary={
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Area promozione</CardTitle>
              <p className="text-sm text-muted-foreground">
                Usa il portale come strumento operativo, non solo come schermata di report.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  href: "/dashboard/links",
                  icon: Link2,
                  label: "Crea link tracciati",
                  value: `${activeLinks}`,
                  hint: "Crea nuove combinazioni destinazione + UTM per campagne o formati contenuto.",
                },
                {
                  href: "/dashboard/codes",
                  icon: TicketPercent,
                  label: "Gestisci codici promo",
                  value: `${activeCodes}`,
                  hint: "Genera o richiedi codici promo aggiuntivi quando una campagna ha bisogno di un'offerta dedicata.",
                },
                {
                  href: "/dashboard/campaigns",
                  icon: Megaphone,
                  label: "Campagne attive",
                  value: `${activeCampaigns}`,
                  hint: "Controlla campagne disponibili, asset e risorse collegate.",
                },
                {
                  href: "/dashboard/assets",
                  icon: Wallet,
                  label: "Asset pronti",
                  value: `${data.promoAssets.length}`,
                  hint: "Apri creativita approvate, talking point e materiali campagna scaricabili.",
                },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="ui-panel-block ui-panel-block-interactive flex items-start justify-between gap-4 transition hover:-translate-y-0.5"
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
                    <div className="text-2xl font-semibold tracking-tight">{item.value}</div>
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
        primary={<ActivityFeed items={data.recentActivity} />}
        secondary={
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Campagne live e asset</CardTitle>
              <p className="text-sm text-muted-foreground">
                Cosa puoi promuovere in questo momento e quanto materiale di supporto e
                disponibile.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.campaigns.slice(0, 3).map((campaign) => (
                <RecordCard key={campaign.id} className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="mt-2 text-sm text-muted-foreground">{campaign.description}</div>
                    </div>
                    <StatusBadge status={campaign.status} />
                  </div>
              <AutoGrid minItemWidth="8rem" className="mt-4">
                    <MetricTile
                      label="Link"
                      value={`${campaign.referralLinks.length}`}
                      hint="link"
                      valueSize="sm"
                      valueType="metric"
                      density="compact"
                    />
                    <MetricTile
                      label="Codici"
                      value={`${campaign.promoCodes.length}`}
                      hint="codici"
                      valueSize="sm"
                      valueType="metric"
                      density="compact"
                    />
                    <MetricTile
                      label="Asset"
                      value={`${campaign.assets.length}`}
                      hint="asset"
                      valueSize="sm"
                      valueType="metric"
                      density="compact"
                    />
                  </AutoGrid>
                </RecordCard>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/campaigns">Apri area campagne</Link>
              </Button>
            </CardContent>
          </Card>
        }
      />
    </div>
  );
}
