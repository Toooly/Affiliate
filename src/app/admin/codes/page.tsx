import Link from "next/link";

import { TicketPercent, Wallet } from "lucide-react";

import { PromoCodeAdminForm } from "@/components/forms/promo-code-admin-form";
import { PromoCodeReviewForm } from "@/components/forms/promo-code-review-form";
import { ProgramSettingsForm } from "@/components/forms/program-settings-form";
import { CopyButton } from "@/components/shared/copy-button";
import { MetricTile } from "@/components/shared/metric-tile";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { formatCurrency } from "@/lib/utils";

type AdminCodesPageProps = {
  searchParams?: Promise<{
    status?: string;
    source?: string;
    campaign?: string;
  }>;
};

export default async function AdminCodesPage({
  searchParams,
}: AdminCodesPageProps) {
  const params = (await searchParams) ?? {};
  const [codes, affiliates, campaigns, dashboard, storeConnection] = await Promise.all([
    getRepository().listPromoCodes("all"),
    getRepository().listInfluencers(),
    getRepository().listCampaigns(),
    getRepository().getAdminOverview(),
    getRepository().getStoreConnection(),
  ]);
  const pending = codes.filter((code) => code.status === "pending");
  const filteredCodes = codes.filter((code) => {
    const matchesStatus =
      !params.status || params.status === "all" || code.status === params.status;
    const matchesSource =
      !params.source || params.source === "all" || code.source === params.source;
    const matchesCampaign =
      !params.campaign ||
      params.campaign === "all" ||
      code.campaignId === params.campaign;

    return matchesStatus && matchesSource && matchesCampaign;
  });
  const buildHref = (overrides: Record<string, string>) => {
    const nextParams = new URLSearchParams();
    const source = {
      status: params.status ?? "all",
      source: params.source ?? "all",
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
    return query ? `/admin/codes?${query}` : "/admin/codes";
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card>
          <CardContent className="p-7">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-primary uppercase">
              Operazioni codici promo
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Assegna, approva e governa i codici promo come in un vero programma affiliate.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
              I codici sono una superficie operativa viva, non una metrica passiva. Mantieni
              chiare le regole self-serve, gestisci rapidamente le richieste in ingresso e tieni
              pulita la mappatura tra affiliati, campagne e sconti.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Snapshot governance</CardTitle>
          </CardHeader>
          <CardContent className="grid auto-rows-fr gap-3 sm:grid-cols-2">
            <MetricTile
              tone="muted"
              label="Generazione self-serve"
              value={
                <StatusBadge
                  status={
                    dashboard.programSettings.allowAffiliateCodeGeneration ? "active" : "disabled"
                  }
                />
              }
              valueSize="sm"
              className="min-h-[118px]"
            />
            <MetricTile
              tone="muted"
              label="Richieste aperte"
              value={
                <StatusBadge
                  status={dashboard.programSettings.allowPromoCodeRequests ? "active" : "disabled"}
                />
              }
              valueSize="sm"
              className="min-h-[118px]"
            />
            <MetricTile
              tone="default"
              label="Prefisso"
              value={dashboard.programSettings.promoCodePrefix}
              valueSize="md"
              className="min-h-[118px]"
            />
            <MetricTile
              tone="default"
              label="Coda in attesa"
              value={pending.length}
              valueSize="md"
              className="min-h-[118px]"
            />
            <MetricTile
              tone="muted"
              label="Sync sconti Shopify"
              value={
                <StatusBadge
                  status={
                    storeConnection.syncDiscountCodesEnabled ? "ready" : "not_connected"
                  }
                />
              }
              valueSize="sm"
              className="min-h-[118px]"
            />
            <MetricTile
              tone="muted"
              label="Match proprieta codice"
              value={
                <StatusBadge
                  status={
                    dashboard.programSettings.requireCodeOwnershipMatch
                      ? "active"
                      : "disabled"
                  }
                />
              }
              valueSize="sm"
              className="min-h-[118px]"
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={params.status ?? "all"} />
            <StatusBadge status={params.source ?? "all"} />
            <StatusBadge
              status={
                params.campaign === "all" || !params.campaign ? "all_campaigns" : params.campaign
              }
            />
            <div className="text-sm text-muted-foreground">
              {filteredCodes.length} codici visibili
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Tutti", value: "all" },
              { label: "Attivi", value: "active" },
              { label: "In revisione", value: "pending" },
              { label: "Disattivati", value: "disabled" },
              { label: "Rifiutati", value: "rejected" },
            ].map((status) => (
              <Link
                key={status.value}
                href={buildHref({ status: status.value })}
                className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
              >
                {status.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Tutte le origini", value: "all" },
              { label: "Assegnati", value: "assigned" },
              { label: "Generati", value: "generated" },
              { label: "Richiesti", value: "requested" },
            ].map((source) => (
              <Link
                key={source.value}
                href={buildHref({ source: source.value })}
                className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
              >
                {source.label}
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
          label="Codici promo"
          value={String(codes.length)}
          hint={`${codes.filter((code) => code.status === "active").length} attivi`}
          icon={TicketPercent}
        />
        <StatCard
          label="Richieste in attesa"
          value={String(pending.length)}
          hint="In attesa di revisione admin"
          icon={TicketPercent}
        />
        <StatCard
          label="Default programma"
          value={`${dashboard.defaultCommissionValue}%`}
          hint={
            storeConnection.autoCreateDiscountCodes
              ? "Generazione codici pronta per Shopify"
              : "Governance sconti gestita dal merchant"
          }
          icon={Wallet}
          emphasis
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Regole generazione codici</CardTitle>
            <p className="text-sm text-muted-foreground">
              Decidi se gli affiliati possono creare codici in autonomia o devono chiedere approvazione.
            </p>
          </CardHeader>
          <CardContent>
            <ProgramSettingsForm initialValues={dashboard.programSettings} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assegna codice promo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Emetti manualmente codici affiliato o campagna quando il programma richiede piu controllo.
            </p>
          </CardHeader>
          <CardContent>
            <PromoCodeAdminForm
              influencers={affiliates.map((affiliate) => ({
                id: affiliate.id,
                fullName: affiliate.fullName,
              }))}
              campaigns={campaigns.map((campaign) => ({
                id: campaign.id,
                name: campaign.name,
              }))}
            />
          </CardContent>
        </Card>
      </section>

      {pending.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Richieste codice in attesa</CardTitle>
            <p className="text-sm text-muted-foreground">
              Revisiona le richieste inviate dagli affiliati e conferma il codice finale quando e pronto.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 xl:grid-cols-2">
            {pending.map((promoCode) => (
              <div key={promoCode.id} className="rounded-[28px] border border-border/70 bg-background/72 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{promoCode.influencerName}</div>
                    <div className="text-sm text-muted-foreground">{promoCode.code}</div>
                  </div>
                  <StatusBadge status={promoCode.status} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {promoCode.requestMessage ?? "Nessuna nota allegata alla richiesta."}
                </p>
                <div className="mt-4">
                  <PromoCodeReviewForm promoCode={promoCode} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Tutti i codici promo</CardTitle>
          <p className="text-sm text-muted-foreground">
            Codici di programma e di campagna attualmente mappati sulla base affiliati.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredCodes.map((promoCode) => (
            <div
              key={promoCode.id}
              className="flex flex-col gap-4 rounded-[26px] border border-border/70 bg-background/72 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium">{promoCode.code}</div>
                  <StatusBadge status={promoCode.status} />
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {promoCode.influencerName} · {promoCode.discountValue}% di sconto · {promoCode.campaignName ?? "Intero programma"}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {promoCode.commission.toFixed(2)} di commissione · {promoCode.suspiciousEventsCount} flag di rischio
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  {promoCode.conversions} conv · {formatCurrency(promoCode.revenue)} ricavi
                </div>
                <CopyButton value={promoCode.code} label="Codice promo" />
                <StatusBadge status={promoCode.source} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
