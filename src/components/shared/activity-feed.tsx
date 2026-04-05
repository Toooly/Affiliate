import {
  Activity,
  Megaphone,
  MousePointerClick,
  ReceiptText,
  ShieldAlert,
  TicketPercent,
  Trophy,
  Wallet,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import type { ActivityItem } from "@/lib/types";
import { formatCurrency, timeAgo } from "@/lib/utils";

const iconMap = {
  click: MousePointerClick,
  conversion: ReceiptText,
  payout: Wallet,
  application: ReceiptText,
  promo_code: TicketPercent,
  campaign: Megaphone,
  fraud_flag: ShieldAlert,
  reward: Trophy,
};

interface ActivityFeedProps {
  items: ActivityItem[];
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Attività recenti</CardTitle>
        <p className="text-sm text-muted-foreground">
          Ultimi click, conversioni, eventi sui codici, aggiornamenti campagna e payout collegati a questo account.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((item) => {
            const Icon = iconMap[item.type];

            return (
              <div
                key={item.id}
                className="ui-panel-block ui-panel-block-strong flex items-start gap-3"
              >
                <div className="ui-icon-chip flex size-10 items-center justify-center rounded-[18px]">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <p className="ui-wrap-pretty font-medium">{item.title}</p>
                    <span className="shrink-0 text-xs text-secondary-foreground">
                      {timeAgo(item.occurredAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-secondary-foreground">{item.detail}</p>
                  {typeof item.amount === "number" ? (
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {formatCurrency(item.amount)}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={Activity}
            title="Nessuna attività registrata"
            description="Quando inizieranno ad arrivare eventi reali di traffico, conversione, payout o revisione li vedrai comparire qui."
          />
        )}
      </CardContent>
    </Card>
  );
}
