import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowRightLeft, BadgeDollarSign, ReceiptText, Wallet } from "lucide-react";

import { PayoutUpdateForm } from "@/components/forms/payout-update-form";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricTile } from "@/components/shared/metric-tile";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepository } from "@/lib/data/repository";
import { formatCurrency, formatShortDate, formatUiLabel } from "@/lib/utils";

type AdminPayoutDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminPayoutDetailPage({
  params,
}: AdminPayoutDetailPageProps) {
  const { id } = await params;
  const data = await getRepository().getPayoutDetail(id);

  if (!data) {
    notFound();
  }

  const activeAllocations = data.allocations.filter((allocation) => allocation.releasedAt === null);
  const releasedAllocations = data.allocations.filter((allocation) => allocation.releasedAt !== null);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
      <Card className="surface-admin">
          <CardContent className="p-7 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="text-[11px] font-semibold tracking-[0.18em] text-white/72 uppercase">
                  Dettaglio payout
                </div>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                  {data.influencer.fullName}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/76">
                  Questo record payout mostra con precisione quali conversioni sono state raggruppate,
                  da quali campagne provengono e se la commissione coperta e ancora in coda, gia pagata
                  o rilasciata di nuovo nella liability.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge
                    status={data.payout.status}
                    className="border-white/15 bg-white/10 text-white"
                  />
                  <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/72">
                    {formatUiLabel(data.payout.method)}
                  </div>
                  {data.payout.campaignNames.map((campaignName) => (
                    <div
                      key={campaignName}
                      className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-white/72"
                    >
                      {campaignName}
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
                <MetricTile
                  label="Importo batch"
                  value={formatCurrency(data.payout.amount, data.payout.currency)}
                  tone="surface"
                  valueSize="md"
                  className="min-h-[126px]"
                />
                <MetricTile
                  label="Creato"
                  value={formatShortDate(data.payout.createdAt)}
                  tone="surface"
                  valueSize="sm"
                  className="min-h-[126px]"
                />
                <MetricTile
                  label="Copertura attiva"
                  value={String(activeAllocations.length)}
                  tone="surface"
                  valueSize="md"
                  className="min-h-[126px]"
                />
                <MetricTile
                  label="Rilasciate"
                  value={String(releasedAllocations.length)}
                  tone="surface"
                  valueSize="md"
                  className="min-h-[126px]"
                />
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href={`/admin/affiliates/${data.influencer.id}`}>Apri affiliato</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-white/8 text-white hover:bg-white/14 hover:text-white"
              >
                <Link href={`/admin/payouts?affiliate=${data.influencer.id}`}>
                  Torna al ledger payout
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Operazioni payout</CardTitle>
            <p className="text-sm text-muted-foreground">
              Aggiorna il record payout, aggiungi un riferimento pagamento o conferma il saldo.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <MetricTile
              label="Riferimento attuale"
              value={data.payout.reference ?? "Riferimento in attesa"}
              tone="muted"
              valueSize="sm"
              className="min-h-[116px]"
              valueClassName="text-sm leading-6 md:text-base"
            />
            <PayoutUpdateForm payout={data.payout} />
            <MetricTile
              label="Comportamento in caso di errore"
              hint="Se questo payout fallisce, le allocazioni correnti vengono rilasciate di nuovo nella coda delle commissioni approvate cosi possono essere raccolte in un nuovo batch."
              tone="default"
              className="min-h-[132px]"
            />
            {data.availableConversions.length ? (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/payouts?affiliate=${data.influencer.id}`}>
                  Crea batch con le commissioni residue
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Commissione coperta"
          value={formatCurrency(data.totals.coveredCommission, data.payout.currency)}
          hint={`${activeAllocations.length} allocazioni attive`}
          icon={Wallet}
        />
        <StatCard
          label="Ricavi coperti"
          value={formatCurrency(data.totals.coveredRevenue, data.payout.currency)}
          hint="Valore ordini attribuiti dentro questo payout"
          icon={ReceiptText}
        />
        <StatCard
          label="Commissione rilasciata"
          value={formatCurrency(data.totals.releasedCommission, data.payout.currency)}
          hint="Rilasciata dopo un payout fallito"
          icon={ArrowRightLeft}
        />
        <StatCard
          label="Approvate aperte"
          value={formatCurrency(data.totals.openApprovedCommission, data.payout.currency)}
          hint={`${data.availableConversions.length} pronte per il prossimo batch`}
          icon={BadgeDollarSign}
        />
        <StatCard
          label="Storico pagato"
          value={formatCurrency(data.totals.paidCommission, data.payout.currency)}
          hint="Totale commissioni pagate di questo affiliato"
          icon={BadgeDollarSign}
          emphasis
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Conversioni coperte</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ogni conversione attualmente o precedentemente collegata a questo record payout.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.allocations.length ? (
              data.allocations.map((allocation) => (
                <div
                  key={allocation.id}
                  className="rounded-[24px] border border-border/70 bg-background/76 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{allocation.orderId}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {allocation.campaignName ?? "Nessuna campagna"} ·{" "}
                        {formatCurrency(allocation.orderAmount, allocation.currency)} ordine
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {formatCurrency(allocation.commissionAmount, allocation.currency)} commissione
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {allocation.referralCode ? `/${allocation.referralCode}` : "Nessun link"} ·{" "}
                        {allocation.promoCode
                          ? `Coupon ${allocation.promoCode}`
                          : "Nessun coupon"}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge status={allocation.conversionStatus} />
                      {allocation.releasedAt ? (
                        <Badge variant="outline">Rilasciata</Badge>
                      ) : (
                        <Badge variant="secondary">Allocazione attiva</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Wallet}
                title="Nessuna allocazione in questo payout"
                description="Questo record payout non copre attualmente alcuna conversione."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Commissioni approvate residue</CardTitle>
            <p className="text-sm text-muted-foreground">
              Conversioni approvate di questo affiliato che sono ancora fuori da qualunque batch payout attivo.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.availableConversions.length ? (
              data.availableConversions.map((conversion) => (
                <div
                  key={conversion.id}
                  className="rounded-[24px] border border-border/70 bg-background/76 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-medium">{conversion.orderId}</div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {conversion.campaignName ?? "Nessuna campagna"} ·{" "}
                        {formatCurrency(conversion.orderAmount, conversion.currency)} ordine
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {formatCurrency(conversion.commissionAmount, conversion.currency)} commissione pronta
                      </div>
                    </div>
                    <Badge variant="outline">Disponibile</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-border/80 bg-background/76 p-4 text-sm text-muted-foreground">
                Nessuna commissione approvata e in attesa fuori dalle allocazioni payout di questo affiliato.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
