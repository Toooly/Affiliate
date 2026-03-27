import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type RecordCardProps = HTMLAttributes<HTMLDivElement>;

interface RecordCardSplitProps {
  primary: ReactNode;
  secondary?: ReactNode;
  asideMinWidth?: string;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
}

export function RecordCard({ className, ...props }: RecordCardProps) {
  return <div className={cn("ui-record-card", className)} {...props} />;
}

export function RecordCardSplit({
  primary,
  secondary,
  asideMinWidth = "18rem",
  className,
  primaryClassName,
  secondaryClassName,
}: RecordCardSplitProps) {
  return (
    <div
      className={cn("ui-record-layout", className)}
      style={{ "--ui-record-aside": asideMinWidth } as CSSProperties}
    >
      <div className={cn("ui-record-main", primaryClassName)}>{primary}</div>
      {secondary ? <div className={cn("ui-record-side", secondaryClassName)}>{secondary}</div> : null}
    </div>
  );
}
