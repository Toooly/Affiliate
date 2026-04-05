import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-border-strong/72 bg-[linear-gradient(180deg,var(--field-top),var(--field-bottom))] px-4 py-2 text-sm text-foreground shadow-[var(--shadow-field)] caret-primary transition placeholder:text-muted-foreground hover:border-primary/24 hover:bg-[linear-gradient(180deg,var(--field-hover-top),var(--field-hover-bottom))] focus-visible:border-primary/40 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring-strong)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:border-border/75 disabled:bg-[linear-gradient(180deg,var(--field-disabled-top),var(--field-disabled-bottom))] disabled:text-muted-foreground disabled:placeholder:text-muted-foreground disabled:shadow-none",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
