import type { LucideIcon } from "lucide-react";

import { MetricTile } from "@/components/shared/metric-tile";
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
    <MetricTile
      label={label}
      value={value}
      hint={hint}
      icon={Icon}
      tone={emphasis ? "brand" : "default"}
      density="default"
      valueSize="md"
      valueType="metric"
      footer={
        <div
          className={cn(
            "inline-flex max-w-full items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] uppercase",
            emphasis
              ? "border-[color:var(--surface-border)] text-[color:var(--surface-muted)]"
              : "border-border/80 text-secondary-foreground",
          )}
        >
          <span className="size-1.5 rounded-full bg-current" />
          Live
        </div>
      }
    />
  );
}
