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
      <CardContent className="flex flex-col items-center justify-center gap-3.5 px-5 py-9 text-center md:py-10">
        <div className="ui-icon-chip flex size-12 items-center justify-center rounded-[22px]">
          <Icon className="size-5" />
        </div>
        <div className="space-y-2">
          <div className="ui-page-overline text-secondary-foreground">
            Pronto quando vuoi
          </div>
          <h3 className="text-[1.05rem] font-semibold leading-7">{title}</h3>
          <p className="max-w-md text-sm leading-6 text-secondary-foreground">{description}</p>
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
