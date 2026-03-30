import type { CSSProperties, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AutoGridGap = "sm" | "md" | "lg";

interface AutoGridProps extends HTMLAttributes<HTMLDivElement> {
  minItemWidth?: string;
  gap?: AutoGridGap;
  equalHeight?: boolean;
}

const gapClasses: Record<AutoGridGap, string> = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-5",
};

export function AutoGrid({
  minItemWidth = "11rem",
  gap = "sm",
  equalHeight = false,
  className,
  style,
  ...props
}: AutoGridProps) {
  return (
    <div
      className={cn(
        "grid items-start [grid-template-columns:repeat(auto-fit,minmax(min(100%,var(--ui-auto-grid-min)),1fr))]",
        equalHeight && "auto-rows-fr items-stretch",
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
