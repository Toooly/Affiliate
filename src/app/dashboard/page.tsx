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
import { CopyButton } from "@/components/shared/copy-button";
import { MetricTile } from "@/components/shared/metric-tile";
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
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="surface-affiliate overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <div className="text-[11px] font-semibold tracking-[0.18em] text-white/70 uppercase">
                  Area affiliato
                </div>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                  {data.profile.fullName}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/78">
                  Qui trovi tutto cio che ti serve per promuoverti al meglio: link attivi, codici promo,
                  materiali di campagna e una vista chiara dei tuoi guadagni.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge
                    status={data.applicationStatus}
                    className="border-white/15 bg-white/10 text-white"
                  />
                  <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/72">
                    {data.influencer.commissionValue}
                    {data.influencer.commissionType === "percentage" ? "%" : ""}{" "}
                    commissione {formatUiLabel(data.influencer.commissionType)}
                  </div>
                </div>
              </div>

              <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:w-[320px]">
                <MetricTile
                  tone="surface"
                  label="Link attivi"
                  value={activeLinks}
                  className="min-h-[126px]"
                />
                <MetricTile
                  tone="surface"
                  label="Codici attivi"
                  value={activeCodes}
                  className="min-h-[126px]"
                />
                <MetricTile
                  tone="surface"
                  label="Campagne live"
                  value={activeCampaigns}
                  className="min-h-[126px]"
                />
                <MetricTile
                  tone="surface"
                  label="Guadagni in attesa"
                  value={formatCurrency(data.stats.pendingCommission)}
                  className="min-h-[126px]"
                />
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-[30px] border border-white/12 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="text-[11px] font-semibold tracking-[0.18em] text-white/70 uppercase">
                  Codice promo principale
                </div>
                <div className="mt-3 text-4xl font-semibold tracking-tight">
                  {data.influencer.discountCode}
                </div>
                <div className="mt-2 text-sm text-white/74">
                  Usalo in caption, stories, note creator e contenuti di campagna.
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <CopyButton
                    value={data.influencer.discountCode}
                    label="Codice promo"
                    className="border-white/15 bg-white/8 text-white hover:bg-white/14 hover:text-white"
                  />
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-white/18 bg-white/8 text-white hover:bg-white/14 hover:text-white"
                  >
                    <Link href="/dashboard/codes">Gestisci codici</Link>
                  </Button>
                </div>
              </div>
              <div className="rounded-[30px] border border-white/12 bg-white/10 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <div className="text-[11px] font-semibold tracking-[0.18em] text-white/70 uppercase">
                  Referral link principale
                </div>
                <div className="mt-3 break-all text-base font-medium text-white">
                  {primaryShareLink}
                </div>
                <div className="mt-2 text-sm text-white/74">
                  Condividi questo link quando vuoi attribuzione del traffico e reportistica sui click.
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <CopyButton
                    value={primaryShareLink}
                    label="Referral link"
                    className="border-white/15 bg-white/8 text-white hover:bg-white/14 hover:text-white"
                  />
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-white/18 bg-white/8 text-white hover:bg-white/14 hover:text-white"
                  >
                    <Link href="/dashboard/links">Crea link</Link>
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/dashboard/links">Crea referral link</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/18 bg-white/8 text-white hover:bg-white/14 hover:text-white"
              >
                <Link href="/dashboard/assets">Sfoglia asset</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/18 bg-white/8 text-white hover:bg-white/14 hover:text-white"
              >
                <Link href="/dashboard/campaigns">Vedi campagne</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/88">
          <CardHeader className="pb-4">
            <CardTitle>Pipeline guadagni</CardTitle>
            <p className="text-sm text-muted-foreground">
              Tieni traccia di quanto hai maturato, di cio che e in attesa di payout e di cio che e gia stato liquidato.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricTile
              tone="muted"
              label="Saldo in attesa"
              value={formatCurrency(data.stats.pendingCommission)}
              valueSize="xl"
              className="min-h-[148px]"
            />
            <div className="grid auto-rows-fr gap-4 sm:grid-cols-2">
              <MetricTile
                label="Commissioni pagate"
                value={formatCurrency(data.stats.paidCommission)}
                valueSize="md"
                className="min-h-[122px]"
              />
              <MetricTile
                label="Commissioni totali"
                value={formatCurrency(data.stats.totalCommission)}
                valueSize="md"
                className="min-h-[122px]"
              />
            </div>
            <MetricTile
              label="Ultimo payout"
              value={data.latestPayout ? formatCurrency(data.latestPayout.amount) : formatCurrency(0)}
              hint={formatUiLabel(data.influencer.payoutMethod ?? "manual")}
              valueSize="md"
              className="min-h-[126px]"
              footer={<StatusBadge status={data.latestPayout?.status ?? "draft"} />}
            />
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/settings">Aggiorna impostazioni payout</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <PerformanceChart title="Performance ultimi 30 giorni" data={data.performance} />

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
                className="flex items-start justify-between gap-4 rounded-[26px] border border-border/70 bg-background/76 p-4 transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-white"
              >
                <div className="flex gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-[18px] bg-secondary text-primary">
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

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <ActivityFeed items={data.recentActivity} />

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Campagne live e asset</CardTitle>
            <p className="text-sm text-muted-foreground">
              Cosa puoi promuovere in questo momento e quanto materiale di supporto e disponibile.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.campaigns.slice(0, 3).map((campaign) => (
              <div
                key={campaign.id}
                className="rounded-[26px] border border-border/70 bg-background/76 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{campaign.name}</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {campaign.description}
                    </div>
                  </div>
                  <StatusBadge status={campaign.status} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] border border-border/70 bg-white/84 p-3 text-sm">
                    {campaign.referralLinks.length} link
                  </div>
                  <div className="rounded-[20px] border border-border/70 bg-white/84 p-3 text-sm">
                    {campaign.promoCodes.length} codici
                  </div>
                  <div className="rounded-[20px] border border-border/70 bg-white/84 p-3 text-sm">
                    {campaign.assets.length} asset
                  </div>
                </div>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/campaigns">Apri area campagne</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
