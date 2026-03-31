import Link from "next/link";

import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  withTagline?: boolean;
}

export function Logo({ className, withTagline = false }: LogoProps) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3", className)}>
      <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-logo)]">
        AF
      </div>
      <div>
        <div className="font-display text-lg font-semibold tracking-tight text-foreground">
          {APP_NAME}
        </div>
        {withTagline ? (
          <div className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
            {APP_TAGLINE}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
