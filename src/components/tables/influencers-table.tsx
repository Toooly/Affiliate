"use client";

import Link from "next/link";

import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { ArrowUpRight, Link2, TicketPercent } from "lucide-react";

import { InfluencerAdminForm } from "@/components/forms/influencer-admin-form";
import { CopyButton } from "@/components/shared/copy-button";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import type { InfluencerListItem } from "@/lib/types";
import { createAbsoluteUrl, formatCurrency, formatPercent, timeAgo } from "@/lib/utils";

const columnHelper = createColumnHelper<InfluencerListItem>();

const columns = [
  columnHelper.accessor("fullName", {
    header: "Affiliato",
    cell: (info) => (
      <div>
        <div className="font-medium">{info.getValue()}</div>
        <div className="text-sm text-muted-foreground">{info.row.original.email}</div>
        <div className="mt-2 text-xs text-muted-foreground">
          {info.row.original.country ?? "Paese non specificato"} ·{" "}
          {info.row.original.primaryPlatform.replaceAll("_", " ")}
        </div>
      </div>
    ),
  }),
  columnHelper.display({
    id: "resources",
    header: "Asset commerciali",
    cell: (info) => (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TicketPercent className="size-4 text-primary" />
          <span className="font-medium">{info.row.original.discountCode}</span>
          <CopyButton value={info.row.original.discountCode} label="Codice sconto" />
        </div>
        <div className="text-xs text-muted-foreground">
          {info.row.original.promoCodesCount} codici · {info.row.original.activeCampaigns} campagne attive
        </div>
      </div>
    ),
  }),
  columnHelper.display({
    id: "link",
    header: "Referral link",
    cell: (info) => {
      const link = info.row.original.primaryReferralLink;
      return link ? (
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Link2 className="size-4" />
            /r/{link.code}
          </span>
          <div className="flex items-center gap-2">
            <CopyButton value={createAbsoluteUrl(`/r/${link.code}`)} label="Referral link" />
            <span className="text-xs text-muted-foreground">
              {info.row.original.lastActivityAt
                ? `Ultima attivita ${timeAgo(info.row.original.lastActivityAt)}`
                : "Nessuna attivita recente"}
            </span>
          </div>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">Nessun link disponibile</span>
      );
    },
  }),
  columnHelper.display({
    id: "performance",
    header: "Performance",
    cell: (info) => {
      const stats = info.row.original.stats;
      return (
        <div className="space-y-1 text-sm">
          <div>{formatCurrency(stats.totalRevenue)} di fatturato</div>
          <div className="text-muted-foreground">
            {stats.conversions} conversioni · {formatPercent(stats.conversionRate)}
          </div>
        </div>
      );
    },
  }),
  columnHelper.display({
    id: "status",
    header: "Stato",
    cell: (info) => (
      <div className="space-y-2">
        <StatusBadge status={info.row.original.isActive ? "active" : "disabled"} />
        <div>
          <StatusBadge status={info.row.original.applicationStatus} />
        </div>
      </div>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: "Azioni",
    cell: (info) => (
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={`/admin/affiliates/${info.row.original.id}`}>
            <ArrowUpRight className="size-4" />
            Apri
          </Link>
        </Button>
        <InfluencerAdminForm influencer={info.row.original} />
      </div>
    ),
  }),
] as ColumnDef<InfluencerListItem, unknown>[];

interface InfluencersTableProps {
  data: InfluencerListItem[];
}

export function InfluencersTable({ data }: InfluencersTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="fullName"
      searchPlaceholder="Cerca affiliati"
      emptyTitle="Nessun affiliato trovato"
      emptyDescription="Gli affiliati approvati appariranno qui dopo la revisione delle candidature."
      toolbarLabel="Directory affiliati"
    />
  );
}
