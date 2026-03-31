import type * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex min-w-0 max-w-full flex-wrap items-center gap-1 rounded-full border px-2.5 py-1 text-left text-[10px] font-semibold leading-4 tracking-[0.12em] uppercase transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-primary/18 bg-[linear-gradient(180deg,rgba(243,234,251,0.98),rgba(232,218,246,0.98))] text-primary-strong",
        secondary:
          "border-border/80 bg-[linear-gradient(180deg,rgba(255,252,247,0.96),rgba(245,236,226,0.96))] text-secondary-foreground",
        outline:
          "border-border/78 bg-[rgba(255,250,244,0.88)] text-secondary-foreground",
        surface:
          "border-[color:var(--surface-border)] bg-[color:var(--surface-overlay-strong)] text-[color:var(--surface-copy)]",
        success:
          "border-success/28 bg-success-surface text-[color:var(--success-ink)]",
        warning:
          "border-warning/30 bg-warning-surface text-[color:var(--warning-ink)]",
        danger:
          "border-destructive/26 bg-danger-surface text-[color:var(--danger-ink)]",
        info:
          "border-info/24 bg-info-surface text-[color:var(--info-ink)]",
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
