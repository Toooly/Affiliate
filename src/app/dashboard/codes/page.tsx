import Link from "next/link";
import { notFound } from "next/navigation";

import { Coins, TicketPercent, Wallet } from "lucide-react";

import { PromoCodeGeneratorForm } from "@/components/forms/promo-code-generator-form";
import { CopyButton } from "@/components/shared/copy-button";
import { MetricTile } from "@/components/shared/metric-tile";
import { StatusBadge } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { formatCurrency, formatUiLabel } from "@/lib/utils";

type DashboardCodesPageProps = {
  searchParams?: Promise<{
    status?: string;
    campaign?: string;
  }>;
};

export default async function DashboardCodesPage({
  searchParams,
}: DashboardCodesPageProps) {
  const session = await requireInfluencer();
  const params = (await searchParams) ?? {};
  const data = await getRepository().getInfluencerDashboard(session.profileId);

  if (!data) {
    notFound();
  }

  const pendingCodes = data.promoCodes.filter((promoCode) => promoCode.status === "pending").length;
  const filteredCodes = data.promoCodes.filter((promoCode) => {
    const matchesStatus = !params.status || params.status === "all" || promoCode.status === params.status;
    const matchesCampaign =
      !params.campaign || params.campaign === "all" || promoCode.campaignId === params.campaign;

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
    return query ? `/dashboard/codes?${query}` : "/dashboard/codes";
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardContent className="p-7">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
              Workspace codici promo
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Tieni le offerte in ordine, cosi chi ti segue sa sempre quale codice usare al checkout.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
              I codici promo sono uno degli strumenti di conversione piu forti. Qui puoi generare nuovi codici, richiedere offerte dedicate per campagna e tenere sotto controllo cosa e attivo, in attesa o da rivedere.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Chiarezza commissionale</CardTitle>
          </CardHeader>
          <CardContent className="grid auto-rows-fr gap-3">
            <MetricTile
              tone="muted"
              label="Modello commissionale"
              value={`${data.influencer.commissionValue}${data.influencer.commissionType === "percentage" ? "%" : ""} ${formatUiLabel(data.influencer.commissionType)}`}
              valueSize="md"
              className="min-h-[126px]"
            />
            <MetricTile
              label="Commissioni in attesa"
              value={formatCurrency(data.stats.pendingCommission)}
              valueSize="md"
              className="min-h-[118px]"
            />
            <MetricTile
              label="Commissioni pagate"
              value={formatCurrency(data.stats.paidCommission)}
              valueSize="md"
              className="min-h-[118px]"
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={params.status ?? "all"} />
            <div className="text-sm text-muted-foreground">{filteredCodes.length} codici visibili</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "active", "pending", "disabled", "rejected"].map((status) => (
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
          label="Codici promo"
          value={String(data.promoCodes.length)}
          hint={`${data.promoCodes.filter((promoCode) => promoCode.status === "active").length} attivi`}
          icon={TicketPercent}
        />
        <StatCard
          label="Richieste in attesa"
          value={String(pendingCodes)}
          hint="In attesa di approvazione admin"
          icon={Coins}
        />
        <StatCard
          label="Commissioni generate"
          value={formatCurrency(data.stats.totalCommission)}
          hint="Su ordini approvati e pagati"
          icon={Wallet}
          emphasis
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Crea o richiedi codici promo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Usa la generazione self-service quando disponibile oppure invia una richiesta se il programma richiede approvazione.
          </p>
        </CardHeader>
        <CardContent>
          <PromoCodeGeneratorForm
            allowGeneration={data.programSettings.allowAffiliateCodeGeneration}
            allowRequests={data.programSettings.allowPromoCodeRequests}
            campaigns={data.campaigns.map((campaign) => ({
              id: campaign.id,
              name: campaign.name,
            }))}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredCodes.map((promoCode) => (
          <Card key={promoCode.id}>
            <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-2xl font-semibold tracking-tight">{promoCode.code}</div>
                  <StatusBadge status={promoCode.status} />
                  {promoCode.isPrimary ? <StatusBadge status="primary" /> : null}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {promoCode.campaignName ?? "Valido su tutto il programma"} · {promoCode.discountValue}% di sconto
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={promoCode.source} />
                  {promoCode.suspiciousEventsCount ? (
                    <StatusBadge status={`${promoCode.suspiciousEventsCount} risk`} />
                  ) : null}
                </div>
                {promoCode.requestMessage ? (
                  <div className="mt-3 text-sm text-muted-foreground">{promoCode.requestMessage}</div>
                ) : null}
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div className="rounded-[18px] border border-border/70 bg-background/76 p-3 text-sm">
                    <div className="text-muted-foreground">Conversioni</div>
                    <div className="mt-1 font-semibold">{promoCode.conversions}</div>
                  </div>
                  <div className="rounded-[18px] border border-border/70 bg-background/76 p-3 text-sm">
                    <div className="text-muted-foreground">Fatturato</div>
                    <div className="mt-1 font-semibold">{formatCurrency(promoCode.revenue)}</div>
                  </div>
                  <div className="rounded-[18px] border border-border/70 bg-background/76 p-3 text-sm">
                    <div className="text-muted-foreground">Commissione</div>
                    <div className="mt-1 font-semibold">{formatCurrency(promoCode.commission)}</div>
                  </div>
                </div>
              </div>
              <CopyButton value={promoCode.code} label="Codice promo" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
