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
      <section className="ui-section-split ui-section-split-sidebar">
        <Card className="surface-admin">
          <CardContent className="p-7 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="ui-surface-overline">
                  Dettaglio payout
                </div>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                  {data.influencer.fullName}
                </h2>
                <p className="mt-3 text-sm leading-7 ui-surface-copy">
                  Questo record payout mostra con precisione quali conversioni sono state raggruppate,
                  da quali campagne provengono e se la commissione coperta e ancora in coda, gia pagata
                  o rilasciata di nuovo nella liability.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge
                    status={data.payout.status}
                    className="ui-surface-status"
                  />
                  <div className="ui-surface-pill">
                    {formatUiLabel(data.payout.method)}
                  </div>
                  {data.payout.campaignNames.map((campaignName) => (
                    <div
                      key={campaignName}
                      className="ui-surface-pill"
                    >
                      {campaignName}
                    </div>
                  ))}
                </div>
              </div>
              <div className="ui-hero-aside grid gap-3 sm:grid-cols-2">
                <MetricTile
                  label="Importo batch"
                  value={formatCurrency(data.payout.amount, data.payout.currency)}
                  tone="surface"
                  valueSize="md"
                  density="hero"
                />
                <MetricTile
                  label="Creato"
                  value={formatShortDate(data.payout.createdAt)}
                  tone="surface"
                  valueSize="sm"
                  density="hero"
                />
                <MetricTile
                  label="Copertura attiva"
                  value={String(activeAllocations.length)}
                  tone="surface"
                  valueSize="md"
                  density="hero"
                />
                <MetricTile
                  label="Rilasciate"
                  value={String(releasedAllocations.length)}
                  tone="surface"
                  valueSize="md"
                  density="hero"
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
                className="ui-surface-action"
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
              density="compact"
              className="ui-mini-metric"
              valueClassName="text-sm leading-6 md:text-base"
            />
            <PayoutUpdateForm payout={data.payout} />
            <MetricTile
              label="Comportamento in caso di errore"
              hint="Se questo payout fallisce, le allocazioni correnti vengono rilasciate di nuovo nella coda delle commissioni approvate cosi possono essere raccolte in un nuovo batch."
              tone="default"
              density="compact"
              className="ui-mini-metric"
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

      <section className="ui-section-split ui-section-split-balanced">
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
                <div key={allocation.id} className="ui-panel-block">
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
                <div key={conversion.id} className="ui-panel-block">
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
              <div className="ui-panel-block border-dashed text-sm text-muted-foreground">
                Nessuna commissione approvata e in attesa fuori dalle allocazioni payout di questo affiliato.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
