"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentHref = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
  const isActive = active || currentHref === href;

  return (
    <Link href={href} className={cn("ui-filter-chip", isActive && "ui-filter-chip-active", className)}>
      {children}
    </Link>
  );
}
