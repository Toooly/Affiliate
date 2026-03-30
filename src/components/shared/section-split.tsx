import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionSplitVariant = "sidebar" | "balanced";

interface SectionSplitProps {
  primary: ReactNode;
  secondary: ReactNode;
  variant?: SectionSplitVariant;
  asideWidth?: string;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
}

export function SectionSplit({
  primary,
  secondary,
  variant = "sidebar",
  asideWidth = "20rem",
  className,
  primaryClassName,
  secondaryClassName,
}: SectionSplitProps) {
  return (
    <section
      className={cn(
        "ui-section-split",
        variant === "balanced" ? "ui-section-split-balanced" : "ui-section-split-sidebar",
        className,
      )}
      style={{ "--ui-section-aside": asideWidth } as CSSProperties}
    >
      <div className={cn("ui-section-pane", primaryClassName)}>{primary}</div>
      <div className={cn("ui-section-pane", secondaryClassName)}>{secondary}</div>
    </section>
  );
}
