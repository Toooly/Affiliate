import Link from "next/link";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  withTagline?: boolean;
}

export function Logo({ className, withTagline = false }: LogoProps) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3", className)}>
      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-[0_24px_52px_-22px_rgba(26,63,169,0.42)]">
        AF
      </div>
      <div>
        <div className="font-display text-lg font-semibold tracking-tight text-foreground">
          Affinity
        </div>
        {withTagline ? (
          <div className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
            Operazioni affiliate Shopify
          </div>
        ) : null}
      </div>
    </Link>
  );
}
