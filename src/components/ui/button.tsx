import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-transparent text-center text-[0.9375rem] font-semibold leading-5 tracking-[0.01em] transition-all duration-200 disabled:pointer-events-none disabled:border-border/70 disabled:bg-[linear-gradient(180deg,var(--field-disabled-top),var(--field-disabled-bottom))] disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring-strong)] focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(180deg,var(--primary-hover)_0%,var(--primary)_52%,var(--primary-strong)_100%)] text-primary-foreground shadow-[var(--shadow-button-primary)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-button-primary-hover)]",
        secondary:
          "border-border-strong/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),var(--layer-shell-bottom))] text-secondary-foreground shadow-[var(--shadow-button-secondary)] hover:-translate-y-[1px] hover:border-primary/30 hover:text-foreground hover:bg-[linear-gradient(180deg,#ffffff,var(--surface-selected))]",
        outline:
          "border-border-strong/78 bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(248,240,231,0.96))] text-secondary-foreground shadow-[var(--shadow-button-outline)] hover:-translate-y-[1px] hover:border-primary/28 hover:bg-[linear-gradient(180deg,rgba(245,238,255,0.96),rgba(236,226,248,0.94))] hover:text-primary-strong",
        surface:
          "border-[color:var(--surface-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.1))] text-[color:var(--surface-foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] hover:-translate-y-[1px] hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.26),rgba(255,255,255,0.12))] hover:text-[color:var(--surface-foreground)] focus-visible:ring-offset-transparent",
        ghost:
          "text-secondary-foreground shadow-none hover:bg-[color:var(--surface-hover)] hover:text-foreground",
        destructive:
          "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--destructive)_82%,white)_0%,var(--destructive)_42%,var(--destructive-strong)_100%)] text-destructive-foreground shadow-[0_24px_56px_-28px_rgba(125,48,65,0.36),inset_0_1px_0_rgba(255,255,255,0.16)] hover:-translate-y-[1px] hover:brightness-[1.02]",
      },
      size: {
        default: "min-h-10 px-4 py-2",
        sm: "min-h-9 px-4 py-2 text-[0.8125rem]",
        lg: "min-h-11 px-5 py-2.5 text-[0.96875rem]",
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
