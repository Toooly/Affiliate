import type { LucideIcon } from "lucide-react";

import { ArrowUpRight } from "lucide-react";

import { MetricTile } from "@/components/shared/metric-tile";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  emphasis?: boolean;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  emphasis = false,
}: StatCardProps) {
  return (
    <Card className="h-full overflow-hidden border-0 bg-transparent shadow-none ring-0">
      <CardContent className="h-full p-0">
        <MetricTile
          label={label}
          value={value}
          hint={hint}
          icon={Icon}
          tone={emphasis ? "brand" : "default"}
          valueSize="lg"
          className="h-full min-h-[156px]"
          footer={
            <div
              className={cn(
                "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase",
                emphasis
                  ? "border-[color:var(--surface-border)] text-white/74"
                  : "border-border/70 text-muted-foreground",
              )}
            >
              <ArrowUpRight className="size-3.5" />
              Snapshot live
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
