import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-transparent text-center text-sm font-semibold leading-5 transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(180deg,var(--primary)_0%,var(--primary-strong)_100%)] text-primary-foreground shadow-[var(--shadow-button-primary)] hover:brightness-[1.04] hover:shadow-[var(--shadow-button-primary-hover)]",
        secondary:
          "border-border/90 bg-[linear-gradient(180deg,var(--layer-elevated-top),var(--layer-panel-bottom))] text-foreground shadow-[var(--shadow-button-secondary)] hover:border-primary/18 hover:bg-[linear-gradient(180deg,var(--card),var(--layer-shell-bottom))]",
        outline:
          "border-border/90 bg-surface-soft text-foreground shadow-[var(--shadow-button-outline)] hover:border-primary/20 hover:bg-surface-elevated",
        surface:
          "border-[color:var(--surface-border)] bg-[color:var(--surface-overlay-strong)] text-[color:var(--surface-foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.18)] hover:text-[color:var(--surface-foreground)] focus-visible:ring-offset-transparent",
        ghost:
          "text-secondary-foreground hover:bg-surface-hover hover:text-foreground",
        destructive:
          "bg-[linear-gradient(180deg,var(--destructive)_0%,var(--destructive-strong)_100%)] text-destructive-foreground shadow-[0_22px_52px_-30px_rgba(125,51,64,0.34),inset_0_1px_0_rgba(255,255,255,0.14)] hover:brightness-[1.03]",
      },
      size: {
        default: "min-h-10 px-4 py-2",
        sm: "min-h-9 px-4 py-2 text-xs",
        lg: "min-h-11 px-5 py-2.5 text-[15px]",
        icon: "size-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
