import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <Card className="ui-card-soft border-dashed border-border/80">
      <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center md:py-14">
        <div className="ui-icon-chip flex size-15 items-center justify-center rounded-[26px]">
          <Icon className="size-6" />
        </div>
        <div className="space-y-2">
          <div className="text-[11px] font-semibold tracking-[0.18em] text-foreground uppercase">
            Pronto quando vuoi
          </div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="max-w-md text-sm leading-7 text-muted-foreground">{description}</p>
        </div>
        {actionLabel && actionHref ? (
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
