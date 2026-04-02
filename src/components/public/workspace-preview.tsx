import Image from "next/image";

import { CheckCircle2, ShieldCheck, Sparkles, Store, Users, Wallet } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type WorkspacePreviewProps = {
  workspace: "merchant" | "affiliate";
  compact?: boolean;
  className?: string;
};

const workspacePreviewCopy = {
  merchant: {
    badge: "Merchant backoffice",
    title: "Approvazioni, payout, codici promo e store operations in un'unica superficie.",
    imageSrc: "/product/admin-overview.png",
    imageAlt: "Preview del backoffice merchant di Affinity",
    frameClassName: "surface-brand",
    metricClassName: "ui-surface-panel",
    badgeVariant: "surface" as const,
    eyebrow: "Cabina di regia operativa",
    metrics: [
      {
        icon: ShieldCheck,
        label: "Approvals",
        value: "Revisione candidature, attivazione account e governance partner",
      },
      {
        icon: Wallet,
        label: "Payout control",
        value: "Ledger, esposizione commissionale e stato dei batch payout",
      },
      {
        icon: Store,
        label: "Store sync",
        value: "Destinazioni Shopify, proprieta codici e salute integrazione",
      },
    ],
  },
  affiliate: {
    badge: "Partner portal",
    title: "Ogni partner vede solo i propri link, codici, guadagni e impostazioni.",
    imageSrc: "/product/affiliate-dashboard.png",
    imageAlt: "Preview del portale affiliato di Affinity",
    frameClassName: "ui-card-soft",
    metricClassName: "ui-soft-block ui-soft-block-strong",
    badgeVariant: "outline" as const,
    eyebrow: "Workspace personale del partner",
    metrics: [
      {
        icon: Users,
        label: "Personal workspace",
        value: "Visibilita limitata al proprio account, senza accesso alle funzioni merchant",
      },
      {
        icon: Sparkles,
        label: "Campaign access",
        value: "Campagne assegnate, asset approvati e codici promo pronti all'uso",
      },
      {
        icon: CheckCircle2,
        label: "Payout clarity",
        value: "Commissioni maturate, payout e stato account leggibili in tempo reale",
      },
    ],
  },
};

export function WorkspacePreview({
  workspace,
  compact = false,
  className,
}: WorkspacePreviewProps) {
  const copy = workspacePreviewCopy[workspace];

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[30px] border p-4 shadow-[var(--shadow-preview)] sm:p-5",
        copy.frameClassName,
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Badge variant={copy.badgeVariant}>{copy.badge}</Badge>
          <div
            className={cn(
              "ui-page-overline",
              workspace === "merchant"
                ? "text-[color:var(--surface-muted)]"
                : "text-muted-foreground",
            )}
          >
            {copy.eyebrow}
          </div>
        </div>
        <div
          className={cn(
            "rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
            workspace === "merchant"
              ? "surface-chip-subtle"
              : "border-border/80 bg-background/70 text-muted-foreground",
          )}
        >
          Vista prodotto
        </div>
      </div>

      <div
        className={cn(
          "mt-4 text-balance text-lg font-semibold leading-7 tracking-tight",
          workspace === "merchant" ? "text-[color:var(--surface-foreground)]" : "text-foreground",
        )}
      >
        {copy.title}
      </div>

      <div
        className={cn(
          "mt-4 overflow-hidden rounded-[24px] border",
          workspace === "merchant" ? "border-white/16 bg-black/10" : "border-border/70 bg-card/90",
        )}
      >
        <Image
          src={copy.imageSrc}
          alt={copy.imageAlt}
          width={1600}
          height={1100}
          className="h-auto w-full"
          priority={workspace === "merchant"}
        />
      </div>

      <div
        className={cn(
          "mt-4 grid gap-3",
          compact ? "sm:grid-cols-1" : "sm:grid-cols-3",
        )}
      >
        {copy.metrics.map((item) => (
          <div key={item.label} className={cn("rounded-[22px] p-3.5", copy.metricClassName)}>
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-2xl",
                  workspace === "merchant"
                    ? "bg-white/10 text-[color:var(--surface-foreground)]"
                    : "ui-icon-chip border-0",
                )}
              >
                <item.icon className="size-4" />
              </div>
              <div
                className={cn(
                  "ui-page-overline",
                  workspace === "merchant"
                    ? "text-[color:var(--surface-muted)]"
                    : "text-muted-foreground",
                )}
              >
                {item.label}
              </div>
            </div>
            <p
              className={cn(
                "mt-3 text-sm leading-6",
                workspace === "merchant"
                  ? "text-[color:var(--surface-copy)]"
                  : "text-muted-foreground",
              )}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
