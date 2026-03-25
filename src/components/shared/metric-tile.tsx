import type { ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type MetricTileTone = "default" | "muted" | "surface" | "brand";
type MetricTileValueSize = "sm" | "md" | "lg" | "xl";

interface MetricTileProps {
  label: ReactNode;
  value?: ReactNode;
  hint?: ReactNode;
  footer?: ReactNode;
  icon?: LucideIcon;
  tone?: MetricTileTone;
  valueSize?: MetricTileValueSize;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
  hintClassName?: string;
  iconClassName?: string;
}

const toneClasses: Record<MetricTileTone, string> = {
  default: "border border-border/70 bg-card/96 text-foreground",
  muted: "border border-border/70 bg-muted/72 text-foreground",
  surface: "border border-white/12 bg-white/10 text-[color:var(--surface-foreground)]",
  brand: "surface-brand text-[color:var(--surface-foreground)]",
};

const labelToneClasses: Record<MetricTileTone, string> = {
  default: "text-muted-foreground",
  muted: "text-muted-foreground",
  surface: "text-white/70",
  brand: "text-white/68",
};

const valueToneClasses: Record<MetricTileTone, string> = {
  default: "text-foreground",
  muted: "text-foreground",
  surface: "text-white",
  brand: "text-white",
};

const hintToneClasses: Record<MetricTileTone, string> = {
  default: "text-muted-foreground",
  muted: "text-muted-foreground",
  surface: "text-white/76",
  brand: "text-white/74",
};

const iconToneClasses: Record<MetricTileTone, string> = {
  default: "bg-secondary text-foreground",
  muted: "bg-white/72 text-foreground",
  surface: "surface-chip text-white",
  brand: "surface-chip text-white",
};

const valueSizeClasses: Record<MetricTileValueSize, string> = {
  sm: "text-lg leading-tight md:text-xl",
  md: "text-2xl leading-tight md:text-[1.7rem]",
  lg: "text-3xl leading-none md:text-[2rem]",
  xl: "text-4xl leading-none md:text-[2.35rem]",
};

export function MetricTile({
  label,
  value,
  hint,
  footer,
  icon: Icon,
  tone = "default",
  valueSize = "md",
  className,
  labelClassName,
  valueClassName,
  hintClassName,
  iconClassName,
}: MetricTileProps) {
  return (
    <div
      className={cn(
        "flex min-h-[136px] min-w-0 flex-col rounded-[24px] p-4 md:min-h-[144px] md:p-5",
        toneClasses[tone],
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "max-w-full text-[11px] font-semibold tracking-[0.16em] leading-5 uppercase text-balance break-words",
              labelToneClasses[tone],
              labelClassName,
            )}
          >
            {label}
          </div>

          {value !== undefined ? (
            <div
              className={cn(
                "mt-3 min-w-0 font-semibold tracking-tight text-balance break-words",
                valueToneClasses[tone],
                valueSizeClasses[valueSize],
                valueClassName,
              )}
            >
              {value}
            </div>
          ) : null}

          {hint ? (
            <div
              className={cn(
                "mt-3 min-w-0 text-sm leading-6 text-balance break-words",
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
              "flex size-11 shrink-0 items-center justify-center rounded-[18px]",
              iconToneClasses[tone],
              iconClassName,
            )}
          >
            <Icon className="size-5" />
          </div>
        ) : null}
      </div>

      {footer ? <div className="mt-auto pt-4">{footer}</div> : null}
    </div>
  );
}
