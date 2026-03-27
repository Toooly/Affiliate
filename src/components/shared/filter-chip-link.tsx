import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FilterChipLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  active?: boolean;
}

export function FilterChipLink({
  href,
  children,
  className,
  active = false,
}: FilterChipLinkProps) {
  return (
    <Link href={href} className={cn("ui-filter-chip", active && "ui-filter-chip-active", className)}>
      {children}
    </Link>
  );
}
