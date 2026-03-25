import Link from "next/link";

import { ArrowRightLeft, Clock3, Wallet } from "lucide-react";

import { PayoutBatchForm } from "@/components/forms/payout-batch-form";
import { StatCard } from "@/components/shared/stat-card";
import { PayoutsTable } from "@/components/tables/payouts-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { formatCurrency, formatUiLabel } from "@/lib/utils";

type AdminPayoutsPageProps = {
  searchParams?: Promise<{
    status?: string;
    affiliate?: string;
    method?: string;
  }>;
};

export default async function AdminPayoutsPage({
  searchParams,
}: AdminPayoutsPageProps) {
  const params = (await searchParams) ?? {};
  const [payouts, conversions, influencers] = await Promise.all([
    getRepository().listPayouts(),
    getRepository().listConversions(),
    getRepository().listInfluencers(),
  ]);

  const buildHref = (overrides: Record<string, string>) => {
    const nextParams = new URLSearchParams();
    const source = {
      status: params.status ?? "all",
      affiliate: params.affiliate ?? "all",
      method: params.method ?? "all",
      ...overrides,
    };

    Object.entries(source).forEach(([key, value]) => {
      if (!value || value === "all") {
        return;
      }

      nextParams.set(key, value);
    });

    const query = nextParams.toString();
    return query ? `/admin/payouts?${query}` : "/admin/payouts";
  };

  const filtered = payouts.filter((payout) => {
    const matchesStatus =
      !params.status || params.status === "all" || payout.status === params.status;
    const matchesAffiliate =
      !params.affiliate ||
      params.affiliate === "all" ||
      payout.influencerId === params.affiliate;
    const matchesMethod =
      !params.method || params.method === "all" || payout.method === params.method;

    return matchesStatus && matchesAffiliate && matchesMethod;
  });

  const eligibleConversions = conversions.filter(
    (conversion) => conversion.status === "approved" && !conversion.isAllocated,
  );
  const queuedConversions = conversions.filter(
    (conversion) => conversion.status === "approved" && conversion.isAllocated,
  );
  const payoutTotals = filtered.reduce(
    (accumulator, payout) => {
      accumulator.total += payout.amount;
      accumulator.pending += payout.status === "pending" ? payout.amount : 0;
      accumulator.processing += payout.status === "processing" ? payout.amount : 0;
      accumulator.paid += payout.status === "paid" ? payout.amount : 0;
      accumulator.covered += payout.coveredCommission;
      return accumulator;
    },
    { total: 0, pending: 0, processing: 0, paid: 0, covered: 0 },
  );
  const commissionTotals = conversions.reduce(
    (accumulator, conversion) => {
      accumulator.pending += conversion.status === "pending" ? conversion.commissionAmount : 0;
      accumulator.approved += conversion.status === "approved" ? conversion.commissionAmount : 0;
      accumulator.paid += conversion.status === "paid" ? conversion.commissionAmount : 0;
      return accumulator;
    },
    { pending: 0, approved: 0, paid: 0 },
  );

  const payoutReadiness = Object.values(
    eligibleConversions.reduce<
      Record<
        string,
        {
          influencerId: string;
          influencerName: string;
          commission: number;
          conversions: number;
          campaigns: Set<string>;
        }
      >
    >((accumulator, conversion) => {
      const current = accumulator[conversion.influencerId] ?? {
        influencerId: conversion.influencerId,
        influencerName: conversion.influencerName,
        commission: 0,
        conversions: 0,
        campaigns: new Set<string>(),
      };

      current.commission += conversion.commissionAmount;
      current.conversions += 1;
      if (conversion.campaignName) {
        current.campaigns.add(conversion.campaignName);
      }
      accumulator[conversion.influencerId] = current;
      return accumulator;
    }, {}),
  )
    .map((item) => ({
      ...item,
      campaignNames: Array.from(item.campaigns),
    }))
    .sort((left, right) => right.commission - left.commission);

  const payoutQueue = filtered
    .filter((payout) => payout.status === "pending" || payout.status === "processing")
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card>
          <CardContent className="p-7">
            <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Controllo allocazione payout
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight">
              Alloca le commissioni approvate in batch payout con tracciabilita completa sulle conversioni.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
              Questo e il workspace finance del merchant per trasformare commissioni approvate in
              record payout tracciabili. Separa la liability aperta, le commissioni gia in coda
              dentro batch payout e quelle gia liquidate.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Crea batch payout</CardTitle>
            <p className="text-sm text-muted-foreground">
              Seleziona conversioni approvate, raggruppale in un unico payout record e mantieni il collegamento con affiliato e campagna.
            </p>
          </CardHeader>
          <CardContent>
            <PayoutBatchForm
              influencers={influencers.map((influencer) => ({
                id: influencer.id,
                fullName: influencer.fullName,
                payoutMethod: influencer.payoutMethod,
              }))}
              conversions={
                eligibleConversions.filter((conversion) =>
                  !params.affiliate || params.affiliate === "all"
                    ? true
                    : conversion.influencerId === params.affiliate,
                )
              }
              defaultInfluencerId={
                params.affiliate && params.affiliate !== "all" ? params.affiliate : undefined
              }
              hideInfluencerField={Boolean(params.affiliate && params.affiliate !== "all")}
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary">Payout visibili: {filtered.length}</Badge>
            <Badge variant="outline">Stato: {params.status ?? "all"}</Badge>
            <Badge variant="outline">Affiliato: {params.affiliate ?? "all"}</Badge>
            <Badge variant="outline">Metodo: {params.method ?? "all"}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {["all", "draft", "pending", "processing", "paid", "failed"].map((status) => (
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
            {["all", "paypal", "bank_transfer", "stripe", "manual"].map((method) => (
              <Link
                key={method}
                href={buildHref({ method })}
                className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
              >
                {formatUiLabel(method)}
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Liability approvata aperta"
          value={formatCurrency(
            eligibleConversions.reduce((sum, conversion) => sum + conversion.commissionAmount, 0),
          )}
          hint={`${eligibleConversions.length} conversioni pronte`}
          icon={Wallet}
        />
        <StatCard
          label="Gia in payout"
          value={formatCurrency(
            queuedConversions.reduce((sum, conversion) => sum + conversion.commissionAmount, 0),
          )}
          hint={`${queuedConversions.length} conversioni approvate gia allocate`}
          icon={ArrowRightLeft}
        />
        <StatCard
          label="Payout in corso"
          value={formatCurrency(payoutTotals.pending + payoutTotals.processing)}
          hint={`${payoutQueue.length} record in coda`}
          icon={Clock3}
        />
        <StatCard
          label="Gia pagati"
          value={formatCurrency(payoutTotals.paid)}
          hint={`${formatCurrency(commissionTotals.paid)} pagati nel ledger`}
          icon={Wallet}
        />
        <StatCard
          label="In revisione"
          value={formatCurrency(commissionTotals.pending)}
          hint="Commissioni non ancora pronte per il payout"
          icon={Wallet}
          emphasis
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Readiness payout per affiliato</CardTitle>
            <p className="text-sm text-muted-foreground">
              Affiliati con commissioni approvate e non allocate che possono entrare subito in un batch payout.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {payoutReadiness.length ? (
              payoutReadiness.slice(0, 6).map((item) => (
                <div
                  key={item.influencerId}
                  className="rounded-[24px] border border-border/70 bg-background/76 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{item.influencerName}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {item.conversions} conversioni approvate · {item.campaignNames.length
                          ? item.campaignNames.join(" / ")
                          : "Nessuna campagna"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(item.commission)}</div>
                      <Link
                        href={buildHref({ affiliate: item.influencerId })}
                        className="mt-1 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
                      >
                        Prepara batch
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border/80 bg-background/76 p-4 text-sm text-muted-foreground">
                Nessuna commissione approvata e non allocata nello scope corrente.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Coda payout attuale</CardTitle>
            <p className="text-sm text-muted-foreground">
              Record payout gia creati e ancora in lavorazione lato merchant.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {payoutQueue.length ? (
              payoutQueue.map((payout) => (
                <div
                  key={payout.id}
                  className="rounded-[24px] border border-border/70 bg-background/76 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{payout.influencerName}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {formatCurrency(payout.amount)} · {formatUiLabel(payout.method)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {payout.activeAllocationsCount} conversioni attive · {payout.campaignNames.join(" / ") || "Nessuna campagna"}
                      </div>
                    </div>
                    <Link
                      href={`/admin/payouts/${payout.id}`}
                      className="text-sm font-medium underline-offset-4 hover:underline"
                    >
                      Apri dettaglio
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border/80 bg-background/76 p-4 text-sm text-muted-foreground">
                Nessun payout in attesa o in elaborazione nel filtro corrente.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Logica payout merchant</CardTitle>
          <p className="text-sm text-muted-foreground">
            Le commissioni approvate possono restare non allocate, entrare in un batch payout o essere segnate come pagate quando il batch si chiude. I payout falliti rilasciano di nuovo le allocazioni.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link
            href="/admin/conversions?status=approved"
            className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
          >
            Rivedi conversioni approvate
          </Link>
          <Link
            href="/admin/conversions?status=approved&payout=available"
            className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
          >
            Vedi approvate non allocate
          </Link>
          <Link
            href="/admin/conversions?status=approved&payout=allocated"
            className="rounded-full border border-border/70 bg-white px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-foreground/20 hover:text-foreground"
          >
            Vedi approvate in coda
          </Link>
        </CardContent>
      </Card>

      <PayoutsTable data={filtered} />
    </div>
  );
}
