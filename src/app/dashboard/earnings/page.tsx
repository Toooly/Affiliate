import { notFound } from "next/navigation";

import { Coins, Wallet } from "lucide-react";

import { AutoGrid } from "@/components/shared/auto-grid";
import { PerformanceChart } from "@/components/charts/performance-chart";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricTile } from "@/components/shared/metric-tile";
import { RecordCard } from "@/components/shared/record-card";
import { SectionSplit } from "@/components/shared/section-split";
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
          <div className="ui-surface-overline text-muted-foreground">
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

      <AutoGrid minItemWidth="12rem" gap="md">
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
      </AutoGrid>

      <SectionSplit
        primary={<PerformanceChart title="Andamento commissioni" data={data.performance} />}
        secondary={
          <Card>
            <CardHeader>
              <CardTitle>Storico payout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AutoGrid minItemWidth="9rem">
                <MetricTile
                  label="In attesa"
                  value="Commissioni registrate"
                  hint="Non ancora liquidate nel batch payout."
                  valueSize="sm"
                  valueType="text"
                  density="compact"
                />
                <MetricTile
                  label="Approvate"
                  value="Pronte al batch"
                  hint="Entrano nel prossimo payout disponibile."
                  valueSize="sm"
                  valueType="text"
                  density="compact"
                />
                <MetricTile
                  label="Pagate"
                  value="Gia saldate"
                  hint="Commissioni chiuse con riferimento payout."
                  valueSize="sm"
                  valueType="text"
                  density="compact"
                />
              </AutoGrid>
              {data.payoutHistory.length ? (
                data.payoutHistory.map((payout) => (
                  <RecordCard key={payout.id} className="flex items-center justify-between gap-4">
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
                  </RecordCard>
                ))
              ) : (
                <EmptyState
                  icon={Wallet}
                  title="Nessun payout registrato"
                  description="Lo storico si popolera quando il merchant elaborera il primo batch payout realmente collegato alle tue commissioni."
                />
              )}
              <div className="ui-panel-block text-sm text-muted-foreground">
                Metodo payout corrente:{" "}
                <span className="font-medium text-foreground capitalize">
                  {formatUiLabel(data.influencer.payoutMethod ?? "manual")}
                </span>
                {" / "}
                stato provider:{" "}
                <span className="font-medium text-foreground">
                  {formatUiLabel(data.influencer.payoutProviderStatus)}
                </span>
              </div>
            </CardContent>
          </Card>
        }
        asideWidth="24rem"
      />
    </div>
  );
}
