import Link from "next/link";
import { notFound } from "next/navigation";

import { Download, ImageIcon } from "lucide-react";

import { CopyButton } from "@/components/shared/copy-button";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { formatUiLabel } from "@/lib/utils";

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
    const nextParams = new URLSearchParams();
    const source = {
      type: params.type ?? "all",
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
    return query ? `/dashboard/assets?${query}` : "/dashboard/assets";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-7">
          <div className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
            Libreria asset promozionali
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Scarica i materiali, recupera caption pronte e resta allineato con le campagne attive.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            Questa libreria riduce l&apos;attrito nella pubblicazione. Usa gli asset approvati,
            copia le caption consigliate quando servono e abbina il giusto contenuto alla campagna corretta.
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
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
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={params.type ?? "all"} />
            <div className="text-sm text-muted-foreground">
              {filteredAssets.length} asset visibili
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "image", "video", "copy", "brand_guide"].map((type) => (
              <Link
                key={type}
                href={buildHref({ type })}
                className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
              >
                {formatUiLabel(type)}
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

      <Card>
        <CardHeader>
          <CardTitle>Asset disponibili</CardTitle>
          <p className="text-sm text-muted-foreground">
            Usa queste risorse per mantenere i contenuti coerenti con il programma affiliate e con le campagne attive.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-2">
          {filteredAssets.map((asset) => (
            <div key={asset.id} className="rounded-[28px] border border-border/70 bg-background/76 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-medium">{asset.title}</div>
                <StatusBadge status={asset.type} />
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{asset.description}</p>
              {asset.caption ? (
                <div className="mt-3 rounded-[22px] border border-border/70 bg-white/84 p-4 text-sm text-muted-foreground">
                  {asset.caption}
                </div>
              ) : null}
              {asset.instructions ? (
                <div className="mt-3 rounded-[22px] border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
                  {asset.instructions}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={asset.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-border/70 bg-white/84 px-4 py-2 text-sm font-medium text-primary transition hover:border-primary/20 hover:bg-white"
                >
                  Apri asset
                </a>
                {asset.caption ? <CopyButton value={asset.caption} label="Caption" /> : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
