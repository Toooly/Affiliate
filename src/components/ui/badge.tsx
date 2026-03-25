import type * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary text-primary-foreground",
        secondary: "border-border/80 bg-secondary text-secondary-foreground",
        outline: "border-border/80 bg-card text-foreground",
        success:
          "border-[color:var(--success)] bg-[color:var(--success-surface)] text-[color:var(--success)]",
        warning:
          "border-[color:var(--warning)] bg-[color:var(--warning-surface)] text-[color:var(--warning)]",
        danger:
          "border-[color:var(--destructive)] bg-[color:var(--danger-surface)] text-[color:var(--destructive)]",
        info:
          "border-[color:var(--info)] bg-[color:var(--info-surface)] text-[color:var(--info)]",
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
