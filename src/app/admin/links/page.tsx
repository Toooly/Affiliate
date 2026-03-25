import Link from "next/link";

import { Link2, MousePointerClick, Wallet } from "lucide-react";

import { ReferralLinkStatusForm } from "@/components/forms/referral-link-status-form";
import { CopyButton } from "@/components/shared/copy-button";
import { MetricTile } from "@/components/shared/metric-tile";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { createAbsoluteUrl, formatCurrency } from "@/lib/utils";

type AdminLinksPageProps = {
  searchParams?: Promise<{
    status?: string;
    risk?: string;
    campaign?: string;
    search?: string;
  }>;
};

export default async function AdminLinksPage({
  searchParams,
}: AdminLinksPageProps) {
  const params = (await searchParams) ?? {};
  const [links, campaigns, catalogItems] = await Promise.all([
    getRepository().listReferralLinks(params.search),
    getRepository().listCampaigns(),
    getRepository().listStoreCatalogItems(),
  ]);
  const filteredLinks = links.filter((link) => {
    const matchesStatus =
      !params.status ||
      params.status === "all" ||
      (params.status === "active" ? link.isActive : !link.isActive);
    const matchesRisk =
      !params.risk ||
      params.risk === "all" ||
      (params.risk === "flagged"
        ? link.suspiciousEventsCount > 0
        : link.suspiciousEventsCount === 0);
    const matchesCampaign =
      !params.campaign ||
      params.campaign === "all" ||
      link.campaignId === params.campaign;

    return matchesStatus && matchesRisk && matchesCampaign;
  });
  const buildHref = (overrides: Record<string, string>) => {
    const nextParams = new URLSearchParams();
    const source = {
      status: params.status ?? "all",
      risk: params.risk ?? "all",
      campaign: params.campaign ?? "all",
      search: params.search ?? "",
      ...overrides,
    };

    Object.entries(source).forEach(([key, value]) => {
      if (!value || value === "all") {
        return;
      }

      nextParams.set(key, value);
    });

    const query = nextParams.toString();
    return query ? `/admin/links?${query}` : "/admin/links";
  };
  const topLink = filteredLinks[0] ?? null;

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardContent className="p-7">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
              Operazioni referral link
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Controlla i link attivi, confronta le performance delle destinazioni e metti in pausa i routing deboli in pochi secondi.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
              Qui mantieni pulita l&apos;attribuzione. I link che performano devono restare visibili,
              quelli inattivi devono essere una scelta intenzionale e il routing campagna deve
              restare coerente con asset e codici che stai spingendo davvero.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Snapshot miglior link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topLink ? (
              <>
                <div className="font-medium">{topLink.name}</div>
                <div className="text-sm text-muted-foreground">
                  {topLink.influencerName} · /r/{topLink.code}
                </div>
                <MetricTile
                  label="Snapshot performance"
                  value={formatCurrency(topLink.revenue)}
                  hint={`${topLink.clicks} click · ${topLink.conversions} conversioni`}
                  tone="muted"
                  valueSize="md"
                  className="min-h-[124px]"
                />
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Nessun link registrato.</div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={params.status ?? "all"} />
            <StatusBadge status={params.risk ?? "all"} />
            <div className="text-sm text-muted-foreground">
              {filteredLinks.length} link visibili
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Tutti", value: "all" },
              { label: "Attivi", value: "active" },
              { label: "Inattivi", value: "inactive" },
            ].map((status) => (
              <Link
                key={status.value}
                href={buildHref({ status: status.value })}
                className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
              >
                {status.label}
              </Link>
            ))}
            {[
              { label: "Tutto il rischio", value: "all" },
              { label: "Segnalati", value: "flagged" },
              { label: "Puliti", value: "clean" },
            ].map((risk) => (
              <Link
                key={risk.value}
                href={buildHref({ risk: risk.value })}
                className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
              >
                {risk.label}
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
            {campaigns.map((campaign) => (
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
          value={String(filteredLinks.length)}
          hint={`${filteredLinks.filter((link) => link.isActive).length} attivi`}
          icon={Link2}
        />
        <StatCard
          label="Click"
          value={String(filteredLinks.reduce((sum, link) => sum + link.clicks, 0))}
          hint="Tracciati su tutti gli affiliati"
          icon={MousePointerClick}
        />
        <StatCard
          label="Ricavi"
          value={formatCurrency(filteredLinks.reduce((sum, link) => sum + link.revenue, 0))}
          hint="Attribuiti dal routing referral"
          icon={Wallet}
          emphasis
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Tutti i referral link</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mantieni attivi i link principali, monitora i link custom di campagna e ferma rapidamente le rotte superate.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredLinks.map((link) => (
            <div key={link.id} className="rounded-[28px] border border-border/70 bg-background/76 p-5">
              {(() => {
                const catalogItem =
                  [...catalogItems]
                    .sort((left, right) => right.destinationUrl.length - left.destinationUrl.length)
                    .find((item) => link.destinationUrl.startsWith(item.destinationUrl)) ?? null;

                return (
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium">{link.name}</div>
                        <StatusBadge status={link.isPrimary ? "primary" : link.isActive ? "active" : "inactive"} />
                        {link.campaignName ? <StatusBadge status={link.campaignName} /> : null}
                        {catalogItem ? <StatusBadge status={catalogItem.type} /> : null}
                        {link.suspiciousEventsCount ? (
                          <StatusBadge status={`${link.suspiciousEventsCount} risk`} />
                        ) : null}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {link.influencerName} · {link.influencerEmail}
                      </div>
                      {catalogItem ? (
                        <div className="mt-1 text-sm text-muted-foreground">
                          Destinazione Shopify: {catalogItem.title}
                        </div>
                      ) : null}
                      <div className="mt-2 text-sm text-muted-foreground">
                        URL condivisibile: {createAbsoluteUrl(`/r/${link.code}`)}
                      </div>
                      <div className="mt-1 break-all text-sm text-muted-foreground">
                        Destinazione: {link.destinationUrl}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <CopyButton value={createAbsoluteUrl(`/r/${link.code}`)} label="Referral link" />
                        <ReferralLinkStatusForm
                          linkId={link.id}
                          isActive={link.isActive}
                          isPrimary={link.isPrimary}
                        />
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
                        label="Ricavi"
                        value={formatCurrency(link.revenue)}
                        tone="default"
                        valueSize="sm"
                        className="min-h-[108px] rounded-[20px] bg-white/84 p-3"
                      />
                      <MetricTile
                        label="Commissione"
                        value={formatCurrency(link.commission)}
                        tone="default"
                        valueSize="sm"
                        className="min-h-[108px] rounded-[20px] bg-white/84 p-3"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
