import { CheckCircle2, ImageIcon, Layers3, Sparkles } from "lucide-react";

import { PromoAssetForm } from "@/components/forms/promo-asset-form";
import { StatCard } from "@/components/shared/stat-card";
import { AssetsTable } from "@/components/tables/assets-table";
import { Card, CardContent } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";

export default async function AdminAssetsPage() {
  const [assets, campaigns] = await Promise.all([
    getRepository().listPromoAssets(),
    getRepository().listCampaigns(),
  ]);
  const assetTypes = new Set(assets.map((asset) => asset.type));
  const campaignLinkedAssets = assets.filter((asset) => asset.campaignId).length;

  return (
    <div className="ui-page-stack">
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Asset"
          value={String(assets.length)}
          hint="Totale risorse promo pubblicate"
          icon={ImageIcon}
        />
        <StatCard
          label="Attivi"
          value={String(assets.filter((asset) => asset.isActive).length)}
          hint="Visibili ora agli affiliati"
          icon={CheckCircle2}
        />
        <StatCard
          label="Collegati a campagne"
          value={String(campaignLinkedAssets)}
          hint={`${assetTypes.size} formati distinti`}
          icon={Layers3}
          emphasis
        />
      </section>

      <Card className="ui-card-hero">
        <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
              <Sparkles className="size-3.5" />
              Libreria creativa
            </div>
            <h2 className="ui-page-title mt-3">
              Pubblica creatività pronta per le campagne con caption, metadati e accesso chiaro per gli affiliati.
            </h2>
          </div>
          <PromoAssetForm
            campaigns={campaigns.map((campaign) => ({
              id: campaign.id,
              name: campaign.name,
            }))}
          />
        </CardContent>
      </Card>
      <AssetsTable
        data={assets}
        campaigns={campaigns.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
        }))}
      />
    </div>
  );
}
