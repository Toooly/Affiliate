import type * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-w-0 max-w-full flex-wrap items-center gap-1 rounded-full border px-2.5 py-1 text-left text-[11px] font-semibold leading-[1.05rem] tracking-[0.11em] uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.64)] transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-primary/28 bg-[linear-gradient(180deg,rgba(246,239,255,0.98),rgba(232,218,246,0.98))] text-primary-strong",
        secondary:
          "border-border-strong/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,236,226,0.96))] text-secondary-foreground",
        outline:
          "border-border-strong/76 bg-[linear-gradient(180deg,rgba(255,252,247,0.88),rgba(246,238,228,0.9))] text-secondary-foreground",
        surface:
          "border-[color:var(--surface-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(255,255,255,0.08))] text-[color:var(--surface-foreground)]",
        success:
          "border-success/30 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--success-surface)_80%,white),var(--success-surface))] text-[color:var(--success-ink)]",
        warning:
          "border-warning/30 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--warning-surface)_80%,white),var(--warning-surface))] text-[color:var(--warning-ink)]",
        danger:
          "border-destructive/28 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--danger-surface)_80%,white),var(--danger-surface))] text-[color:var(--danger-ink)]",
        info:
          "border-info/26 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--info-surface)_82%,white),var(--info-surface))] text-[color:var(--info-ink)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
