import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AutoGridGap = "sm" | "md" | "lg";

interface AutoGridProps extends HTMLAttributes<HTMLDivElement> {
  minItemWidth?: string;
  gap?: AutoGridGap;
}

const gapClasses: Record<AutoGridGap, string> = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-5",
};

export function AutoGrid({
  minItemWidth = "11rem",
  gap = "sm",
  className,
  style,
  ...props
}: AutoGridProps) {
  return (
    <div
      className={cn(
        "grid auto-rows-fr [grid-template-columns:repeat(auto-fit,minmax(min(100%,var(--ui-auto-grid-min)),1fr))]",
        gapClasses[gap],
        className,
      )}
      style={
        {
          "--ui-auto-grid-min": minItemWidth,
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  );
}
