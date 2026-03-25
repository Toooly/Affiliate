import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.99]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_20px_52px_-30px_rgba(17,58,66,0.38)] hover:bg-[var(--primary-strong)]",
        secondary:
          "border border-border/80 bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] hover:bg-[var(--secondary-strong)]",
        outline:
          "border border-border/90 bg-card text-foreground shadow-[0_14px_36px_-28px_rgba(23,48,56,0.18)] hover:border-primary/24 hover:bg-[#fffaf1]",
        ghost: "text-muted-foreground hover:bg-muted/65 hover:text-foreground",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_18px_48px_-30px_rgba(123,56,42,0.34)] hover:bg-[#9c4738]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-[15px]",
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
