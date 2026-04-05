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
    "border border-border-strong/64 bg-[linear-gradient(180deg,var(--layer-elevated-top),var(--layer-shell-bottom))] text-foreground shadow-[var(--shadow-sm)]",
  muted:
    "border border-border-strong/60 bg-[linear-gradient(180deg,var(--layer-soft-top),var(--layer-panel-bottom))] text-foreground shadow-[var(--shadow-xs)]",
  surface: "ui-surface-panel text-[color:var(--surface-foreground)]",
  brand: "surface-brand text-[color:var(--surface-foreground)]",
};

const labelToneClasses: Record<MetricTileTone, string> = {
  default: "text-muted-foreground",
  muted: "text-secondary-foreground",
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
  default: "text-secondary-foreground",
  muted: "text-muted-foreground",
  surface: "text-[color:var(--surface-copy)]",
  brand: "text-[color:var(--surface-copy)]",
};

const iconToneClasses: Record<MetricTileTone, string> = {
  default: "ui-icon-chip",
  muted:
    "border border-border-strong/72 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),var(--layer-shell-bottom))] text-primary-strong shadow-[var(--shadow-field)]",
  surface: "surface-chip text-[color:var(--surface-foreground)]",
  brand: "surface-chip text-[color:var(--surface-foreground)]",
};

const valueSizeClasses: Record<MetricTileValueSize, string> = {
  sm: "text-[clamp(0.95rem,1.2vw,1.08rem)] leading-tight",
  md: "text-[clamp(1.1rem,1.7vw,1.4rem)] leading-[1.08]",
  lg: "text-[clamp(1.35rem,2.25vw,1.75rem)] leading-[1.04]",
  xl: "text-[clamp(1.6rem,2.8vw,2.05rem)] leading-none",
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
              "text-[11px] leading-[1.05rem] tracking-[0.14em]",
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
                "ui-wrap-pretty min-w-0 text-[0.875rem] leading-6",
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
