import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type MetricTileTone = "default" | "muted" | "surface" | "brand";
type MetricTileDensity = "compact" | "default" | "hero";
type MetricTileValueSize = "sm" | "md" | "lg" | "xl";
type MetricTileValueType = "metric" | "text" | "url" | "code";

interface MetricTileProps {
  label: ReactNode;
  value?: ReactNode;
  hint?: ReactNode;
  footer?: ReactNode;
  icon?: LucideIcon;
  tone?: MetricTileTone;
  density?: MetricTileDensity;
  valueSize?: MetricTileValueSize;
  valueType?: MetricTileValueType;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  hintClassName?: string;
  iconClassName?: string;
}

const toneClasses: Record<MetricTileTone, string> = {
  default:
    "border border-border/88 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,245,238,0.98))] text-foreground shadow-[0_14px_32px_-26px_rgba(14,18,28,0.12)]",
  muted:
    "border border-border/84 bg-[linear-gradient(180deg,rgba(248,243,236,0.98),rgba(244,239,231,0.98))] text-foreground shadow-[0_12px_28px_-24px_rgba(14,18,28,0.1)]",
  surface: "ui-surface-panel text-[color:var(--surface-foreground)]",
  brand: "surface-brand text-[color:var(--surface-foreground)]",
};

const labelToneClasses: Record<MetricTileTone, string> = {
  default: "text-secondary-foreground",
  muted: "text-muted-foreground",
  surface: "text-[color:var(--surface-muted)]",
  brand: "text-[color:var(--surface-muted)]",
};

const valueToneClasses: Record<MetricTileTone, string> = {
  default: "text-foreground",
  muted: "text-foreground",
  surface: "text-[color:var(--surface-foreground)]",
  brand: "text-[color:var(--surface-foreground)]",
};

const hintToneClasses: Record<MetricTileTone, string> = {
  default: "text-muted-foreground",
  muted: "text-secondary-foreground",
  surface: "text-[color:var(--surface-copy)]",
  brand: "text-[color:var(--surface-copy)]",
};

const iconToneClasses: Record<MetricTileTone, string> = {
  default: "ui-icon-chip",
  muted:
    "border border-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(250,245,238,0.98))] text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_26px_-22px_rgba(14,18,28,0.12)]",
  surface: "surface-chip text-[color:var(--surface-foreground)]",
  brand: "surface-chip text-[color:var(--surface-foreground)]",
};

const valueSizeClasses: Record<MetricTileValueSize, string> = {
  sm: "text-[clamp(0.95rem,1.35vw,1.1rem)] leading-tight",
  md: "text-[clamp(1.2rem,2vw,1.55rem)] leading-[1.08]",
  lg: "text-[clamp(1.45rem,2.6vw,1.9rem)] leading-[1.02]",
  xl: "text-[clamp(1.8rem,3.2vw,2.3rem)] leading-none",
};

const valueTypeClasses: Record<MetricTileValueType, string> = {
  metric: "ui-value-metric",
  text: "ui-value-text",
  url: "ui-value-url text-sm leading-6 md:text-base",
  code: "ui-value-metric tracking-[0.02em]",
};

const densityClasses: Record<MetricTileDensity, string> = {
  compact: "gap-2.5 rounded-[var(--surface-radius-sm)] p-[var(--surface-pad-sm)]",
  default:
    "min-h-[92px] gap-3 rounded-[var(--surface-radius-md)] p-[var(--surface-pad-md)] md:p-[var(--surface-pad-lg)]",
  hero:
    "min-h-[100px] gap-3.5 rounded-[var(--surface-radius-lg)] p-[var(--surface-pad-lg)] md:min-h-[108px] md:p-[var(--surface-pad-xl)]",
};

export function MetricTile({
  label,
  value,
  hint,
  footer,
  icon: Icon,
  tone = "default",
  density = "default",
  valueSize = "md",
  valueType = "metric",
  className,
  labelClassName,
  valueClassName,
  hintClassName,
  iconClassName,
}: MetricTileProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col",
        densityClasses[density],
        toneClasses[tone],
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "ui-wrap-pretty max-w-full text-[11px] font-semibold tracking-[0.16em] leading-5 uppercase",
              "text-[10px] leading-4 tracking-[0.14em]",
              labelToneClasses[tone],
              labelClassName,
            )}
          >
            {label}
          </div>

          {value !== undefined ? (
            <div
              className={cn(
                "min-w-0 max-w-full font-semibold tracking-tight",
                valueToneClasses[tone],
                valueSizeClasses[valueSize],
                valueTypeClasses[valueType],
                valueClassName,
              )}
            >
              {value}
            </div>
          ) : null}

          {hint ? (
            <div
              className={cn(
                "ui-wrap-pretty min-w-0 text-sm leading-6",
                hintToneClasses[tone],
                hintClassName,
              )}
            >
              {hint}
            </div>
          ) : null}
        </div>

        {Icon ? (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-[16px]",
              iconToneClasses[tone],
              iconClassName,
            )}
          >
            <Icon className="size-4" />
          </div>
        ) : null}
      </div>

      {footer ? <div className="mt-2 min-w-0">{footer}</div> : null}
    </div>
  );
}
