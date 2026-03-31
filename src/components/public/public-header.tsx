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
        "mx-auto flex w-full flex-wrap items-center justify-between gap-4 px-4 py-5 lg:px-6",
        maxWidthClassName,
        className,
      )}
    >
      <Logo withTagline />
      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
        {children}
      </div>
    </header>
  );
}
