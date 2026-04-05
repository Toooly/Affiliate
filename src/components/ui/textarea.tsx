import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
    "flex min-h-[104px] w-full rounded-3xl border border-border-strong/72 bg-[linear-gradient(180deg,var(--field-top),var(--field-bottom))] px-4 py-3 text-sm text-foreground shadow-[var(--shadow-field)] transition placeholder:text-muted-foreground hover:border-primary/24 hover:bg-[linear-gradient(180deg,var(--field-hover-top),var(--field-hover-bottom))] focus-visible:border-primary/40 focus-visible:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring-strong)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:border-border/75 disabled:bg-[linear-gradient(180deg,var(--field-disabled-top),var(--field-disabled-bottom))] disabled:text-muted-foreground disabled:placeholder:text-muted-foreground disabled:shadow-none disabled:opacity-100",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
