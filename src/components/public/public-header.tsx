import type { ReactNode } from "react";

import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";

interface PublicHeaderProps {
  children?: ReactNode;
  className?: string;
  maxWidthClassName?: string;
}

export function PublicHeader({
  children,
  className,
  maxWidthClassName = "max-w-[1180px]",
}: PublicHeaderProps) {
  return (
    <header
      className={cn(
        "mx-auto w-full px-4 pt-5 lg:px-6",
        maxWidthClassName,
        className,
      )}
    >
      <div className="ui-card-shell ui-card-soft flex min-w-0 flex-wrap items-center justify-between gap-4 rounded-[28px] px-4 py-3.5 sm:px-5">
        <Logo withTagline />
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          {children}
        </div>
      </div>
    </header>
  );
}
