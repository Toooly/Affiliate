import { notFound } from "next/navigation";

import { Coins, Wallet } from "lucide-react";

import { PerformanceChart } from "@/components/charts/performance-chart";
import { MetricTile } from "@/components/shared/metric-tile";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInfluencer } from "@/lib/auth/session";
import { getRepository } from "@/lib/data/repository";
import { formatCurrency, formatShortDate, formatUiLabel } from "@/lib/utils";

export default async function DashboardEarningsPage() {
  const session = await requireInfluencer();
  const data = await getRepository().getInfluencerDashboard(session.profileId);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-7">
          <div className="text-[11px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            Guadagni e payout
          </div>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">
            Tieni sotto controllo importi in attesa, approvati, pagati e storico payout in un solo posto.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            Questa area e il tuo ledger economico: cosa hai generato, cosa e in approvazione e cosa e gia stato processato come payout.
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="In attesa"
          value={formatCurrency(data.stats.pendingCommission)}
          hint="Commissioni non ancora pagate"
          icon={Wallet}
        />
        <StatCard
          label="Pagate"
          value={formatCurrency(data.stats.paidCommission)}
          hint="Commissioni gia liquidate"
          icon={Wallet}
        />
        <StatCard
          label="Totale"
          value={formatCurrency(data.stats.totalCommission)}
          hint="Totale commissioni generate"
          icon={Coins}
          emphasis
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PerformanceChart title="Andamento commissioni" data={data.performance} />
        <Card>
          <CardHeader>
            <CardTitle>Storico payout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid auto-rows-fr gap-3 sm:grid-cols-3">
              <MetricTile
                label="In attesa"
                value="Commissioni registrate"
                hint="Non ancora liquidate nel batch payout."
                valueSize="sm"
                className="min-h-[132px]"
              />
              <MetricTile
                label="Approvate"
                value="Pronte al batch"
                hint="Entrano nel prossimo payout disponibile."
                valueSize="sm"
                className="min-h-[132px]"
              />
              <MetricTile
                label="Pagate"
                value="Gia saldate"
                hint="Commissioni chiuse con riferimento payout."
                valueSize="sm"
                className="min-h-[132px]"
              />
            </div>
            {data.payoutHistory.map((payout) => (
              <div
                key={payout.id}
                className="flex items-center justify-between gap-4 rounded-[22px] border border-border/70 bg-background/76 p-4"
              >
                <div>
                  <div className="font-medium">{formatCurrency(payout.amount)}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {payout.reference ?? "Riferimento in attesa"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {formatShortDate(payout.createdAt)}
                  </div>
                </div>
                <StatusBadge status={payout.status} />
              </div>
            ))}
            <div className="rounded-[22px] border border-border/70 bg-white p-4 text-sm text-muted-foreground">
              Metodo payout corrente:{" "}
              <span className="font-medium text-foreground capitalize">
                {formatUiLabel(data.influencer.payoutMethod ?? "manual")}
              </span>
              {" · "}
              stato provider:{" "}
              <span className="font-medium text-foreground">
                {formatUiLabel(data.influencer.payoutProviderStatus)}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
