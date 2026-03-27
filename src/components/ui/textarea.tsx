import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-3xl border border-border-strong/70 bg-[linear-gradient(180deg,var(--layer-elevated-top),var(--layer-elevated-bottom))] px-4 py-3 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_28px_-24px_rgba(14,18,28,0.18)] transition placeholder:text-muted-foreground hover:border-primary/16 focus-visible:border-primary/34 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring-strong)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:border-border/75 disabled:bg-surface-disabled disabled:text-muted-foreground disabled:placeholder:text-muted-foreground disabled:shadow-none disabled:opacity-100",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
