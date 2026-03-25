import Link from "next/link";
import { notFound } from "next/navigation";

import { Link2, MousePointerClick, Wallet } from "lucide-react";

import { ArchiveReferralLinkButton } from "@/components/forms/archive-referral-link-button";
import { ReferralLinkForm } from "@/components/forms/referral-link-form";
import { CopyButton } from "@/components/shared/copy-button";
import { MetricTile } from "@/components/shared/metric-tile";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { createAbsoluteUrl, formatCurrency, formatUiLabel, timeAgo } from "@/lib/utils";

type DashboardLinksPageProps = {
  searchParams?: Promise<{
    status?: string;
    campaign?: string;
  }>;
};

export default async function DashboardLinksPage({
  searchParams,
}: DashboardLinksPageProps) {
  const session = await requireInfluencer();
  const params = (await searchParams) ?? {};
  const data = await getRepository().getInfluencerDashboard(session.profileId);

  if (!data) {
    notFound();
  }

  const filteredLinks = data.referralLinks.filter((link) => {
    const matchesStatus =
      !params.status ||
      params.status === "all" ||
      (params.status === "active" ? link.isActive : !link.isActive);
    const matchesCampaign =
      !params.campaign || params.campaign === "all" || link.campaignId === params.campaign;

    return matchesStatus && matchesCampaign;
  });
  const buildHref = (overrides: Record<string, string>) => {
    const nextParams = new URLSearchParams();
    const source = {
      status: params.status ?? "all",
      campaign: params.campaign ?? "all",
      ...overrides,
    };

    Object.entries(source).forEach(([key, value]) => {
      if (!value || value === "all") {
        return;
      }

      nextParams.set(key, value);
    });

    const query = nextParams.toString();
    return query ? `/dashboard/links?${query}` : "/dashboard/links";
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardContent className="p-7">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
              Workspace referral link
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Crea link tracciati per prodotti, campagne e formati contenuto.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
              Usa nomi chiari per capire subito quale angolo creativo, landing page o destinazione campagna converte meglio.
              Aggiungi parametri UTM quando vuoi report piu puliti nei dati del tuo store.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Linee guida link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <div className="rounded-[22px] border border-border/70 bg-background/76 p-4">
              Dai ai link un nome basato sull&apos;intento del contenuto, non solo sulla destinazione.
            </div>
            <div className="rounded-[22px] border border-border/70 bg-background/76 p-4">
              Collega il link a una campagna quando la landing fa parte di una promozione attiva.
            </div>
            <div className="rounded-[22px] border border-border/70 bg-background/76 p-4">
              Aggiungi parametri UTM se vuoi confrontare traffico da stories, reel, email o bio.
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={params.status ?? "all"} />
            <div className="text-sm text-muted-foreground">{filteredLinks.length} link visibili</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "active", "inactive"].map((status) => (
              <Link
                key={status}
                href={buildHref({ status })}
                className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
              >
                {formatUiLabel(status)}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildHref({ campaign: "all" })}
              className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
            >
              Tutte le campagne
            </Link>
            {data.campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={buildHref({ campaign: campaign.id })}
                className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
              >
                {campaign.name}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Link"
          value={String(data.referralLinks.length)}
          hint={`${data.referralLinks.filter((link) => link.isActive).length} attivi`}
          icon={Link2}
        />
        <StatCard
          label="Click"
          value={String(data.referralLinks.reduce((sum, link) => sum + link.clicks, 0))}
          hint="Su tutti i tuoi link"
          icon={MousePointerClick}
        />
        <StatCard
          label="Fatturato"
          value={formatCurrency(data.referralLinks.reduce((sum, link) => sum + link.revenue, 0))}
          hint="Attribuito dai link"
          icon={Wallet}
          emphasis
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Crea un nuovo referral link</CardTitle>
        </CardHeader>
        <CardContent>
          <ReferralLinkForm
            allowedDestinations={data.programSettings.allowedDestinationUrls}
            campaigns={data.campaigns.map((campaign) => ({
              id: campaign.id,
              name: campaign.name,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>I tuoi link operativi</CardTitle>
          <p className="text-sm text-muted-foreground">
            Il link deve essere subito leggibile, il contesto campagna chiaro e la performance facile da confrontare.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredLinks.map((link) => (
            <div key={link.id} className="rounded-[28px] border border-border/70 bg-background/76 p-5">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-medium">{link.name}</div>
                    <StatusBadge
                      status={link.isPrimary ? "primary" : link.isActive ? "active" : "inactive"}
                    />
                    {link.campaignName ? <StatusBadge status={link.campaignName} /> : null}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    URL da condividere: {createAbsoluteUrl(`/r/${link.code}`)}
                  </div>
                  <div className="mt-1 break-all text-sm text-muted-foreground">
                    Destinazione: {link.destinationUrl}
                  </div>
                  {link.utmSource || link.utmMedium || link.utmCampaign ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {link.utmSource ? <StatusBadge status={`utm:${link.utmSource}`} /> : null}
                      {link.utmMedium ? <StatusBadge status={`medium:${link.utmMedium}`} /> : null}
                      {link.utmCampaign ? <StatusBadge status={`campaign:${link.utmCampaign}`} /> : null}
                    </div>
                  ) : null}
                  <div className="mt-3 text-xs text-muted-foreground">
                    {link.lastClickAt ? `Ultimo click tracciato ${timeAgo(link.lastClickAt)}` : "Nessun click tracciato al momento"}
                    {link.suspiciousEventsCount ? ` · ${link.suspiciousEventsCount} flag rischio` : ""}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px] xl:grid-cols-4">
                  <MetricTile
                    label="Click"
                    value={String(link.clicks)}
                    tone="default"
                    valueSize="sm"
                    className="min-h-[108px] rounded-[20px] bg-white/84 p-3"
                  />
                  <MetricTile
                    label="Conversioni"
                    value={String(link.conversions)}
                    tone="default"
                    valueSize="sm"
                    className="min-h-[108px] rounded-[20px] bg-white/84 p-3"
                  />
                  <MetricTile
                    label="Fatturato"
                    value={formatCurrency(link.revenue)}
                    tone="default"
                    valueSize="sm"
                    className="min-h-[108px] rounded-[20px] bg-white/84 p-3"
                  />
                  <div className="flex min-h-[108px] min-w-0 flex-col justify-between rounded-[20px] border border-border/70 bg-white/84 p-3">
                    <CopyButton value={createAbsoluteUrl(`/r/${link.code}`)} label="Link da condividere" />
                    {!link.isPrimary ? (
                      <ArchiveReferralLinkButton linkId={link.id} disabled={!link.isActive} />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
