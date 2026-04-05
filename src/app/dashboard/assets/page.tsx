import { notFound } from "next/navigation";

import { Download, ImageIcon } from "lucide-react";

import { AutoGrid } from "@/components/shared/auto-grid";
import { CopyButton } from "@/components/shared/copy-button";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterChipLink } from "@/components/shared/filter-chip-link";
import { RecordCard } from "@/components/shared/record-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { buildPathWithQuery, formatUiLabel } from "@/lib/utils";

type DashboardAssetsPageProps = {
  searchParams?: Promise<{
    type?: string;
    campaign?: string;
  }>;
};

export default async function DashboardAssetsPage({
  searchParams,
}: DashboardAssetsPageProps) {
  const session = await requireInfluencer();
  const params = (await searchParams) ?? {};
  const data = await getRepository().getInfluencerDashboard(session.profileId);

  if (!data) {
    notFound();
  }

  const campaignAssets = data.promoAssets.filter((asset) => asset.campaignId).length;
  const filteredAssets = data.promoAssets.filter((asset) => {
    const matchesType = !params.type || params.type === "all" || asset.type === params.type;
    const matchesCampaign =
      !params.campaign || params.campaign === "all" || asset.campaignId === params.campaign;

    return matchesType && matchesCampaign;
  });
  const buildHref = (overrides: Record<string, string>) => {
    return buildPathWithQuery("/dashboard/assets", {
      type: params.type ?? "all",
      campaign: params.campaign ?? "all",
      ...overrides,
    });
  };

  return (
    <div className="ui-page-stack">
      <Card className="ui-card-hero">
        <CardContent className="p-7">
          <div className="ui-surface-overline text-primary">
            Libreria asset promozionali
          </div>
          <h2 className="ui-page-title mt-4">
            Scarica i materiali, recupera caption pronte e resta allineato con le campagne attive.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            Questa libreria riduce l&apos;attrito nella pubblicazione. Usa gli asset approvati,
            copia le caption consigliate quando servono e abbina il giusto contenuto alla campagna corretta.
          </p>
        </CardContent>
      </Card>

      <AutoGrid minItemWidth="12rem" gap="md">
        <StatCard
          label="Asset"
          value={String(data.promoAssets.length)}
          hint="Pubblicati nel tuo portale"
          icon={ImageIcon}
        />
        <StatCard
          label="Asset campagna"
          value={String(campaignAssets)}
          hint="Collegati a campagne specifiche"
          icon={ImageIcon}
        />
        <StatCard
          label="Tipi di asset"
          value={String(new Set(data.promoAssets.map((asset) => asset.type)).size)}
          hint="Immagini, video, copy e brand guide"
          icon={Download}
          emphasis
        />
      </AutoGrid>

      <Card className="ui-card-soft ui-toolbar-card">
        <CardContent className="ui-toolbar-content">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={params.type ?? "all"} />
            <div className="text-sm text-muted-foreground">
              {filteredAssets.length} asset visibili
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "image", "video", "copy", "brand_guide"].map((type) => (
              <FilterChipLink key={type} href={buildHref({ type })}>
                {formatUiLabel(type)}
              </FilterChipLink>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterChipLink href={buildHref({ campaign: "all" })}>
              Tutte le campagne
            </FilterChipLink>
            {data.campaigns.map((campaign) => (
              <FilterChipLink key={campaign.id} href={buildHref({ campaign: campaign.id })}>
                {campaign.name}
              </FilterChipLink>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Asset disponibili</CardTitle>
          <p className="text-sm text-muted-foreground">
            Usa queste risorse per mantenere i contenuti coerenti con il programma affiliate e con le campagne attive.
          </p>
        </CardHeader>
        <CardContent>
          <AutoGrid minItemWidth="20rem" gap="md">
            {filteredAssets.length ? (
              filteredAssets.map((asset) => (
                <RecordCard key={asset.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-medium">{asset.title}</div>
                    <StatusBadge status={asset.type} />
                  </div>
                  <p className="ui-wrap-pretty mt-3 text-sm leading-6 text-muted-foreground">
                    {asset.description}
                  </p>
                  {asset.caption ? (
                    <div className="ui-soft-block ui-soft-block-strong mt-3 text-sm text-muted-foreground">
                      {asset.caption}
                    </div>
                  ) : null}
                  {asset.instructions ? (
                    <div className="ui-soft-block mt-3 text-sm text-muted-foreground">
                      {asset.instructions}
                    </div>
                  ) : null}
                  <div className="ui-inline-actions mt-4">
                    <a
                      href={asset.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="ui-filter-chip text-primary"
                    >
                      Apri asset
                    </a>
                    {asset.caption ? <CopyButton value={asset.caption} label="Caption" /> : null}
                  </div>
                </RecordCard>
              ))
            ) : (
              <EmptyState
                icon={ImageIcon}
                title="Nessun asset disponibile"
                description="Asset, caption e materiali campagna compariranno qui solo dopo una pubblicazione reale dal pannello merchant."
              />
            )}
          </AutoGrid>
        </CardContent>
      </Card>
    </div>
  );
}
