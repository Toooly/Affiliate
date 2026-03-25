"use client";

import Link from "next/link";

import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";

import { PayoutUpdateForm } from "@/components/forms/payout-update-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/tables/data-table";
import type { PayoutListItem } from "@/lib/types";
import { formatCurrency, formatShortDate, formatUiLabel } from "@/lib/utils";

const columnHelper = createColumnHelper<PayoutListItem>();

const columns = [
  columnHelper.accessor("influencerName", {
    header: "Affiliato",
    cell: (info) => (
      <div>
        <div className="font-medium">{info.getValue()}</div>
        <div className="text-sm text-muted-foreground">
          {info.row.original.influencerEmail}
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("amount", {
    header: "Importo",
    cell: (info) => formatCurrency(info.getValue(), info.row.original.currency),
  }),
  columnHelper.display({
    id: "coverage",
    header: "Copertura",
    cell: (info) => (
      <div>
        <div className="font-medium">
          {info.row.original.activeAllocationsCount} conversioni attive
        </div>
        <div className="text-sm text-muted-foreground">
          {formatCurrency(info.row.original.coveredCommission, info.row.original.currency)}
          {info.row.original.releasedCommission
            ? ` attive · ${formatCurrency(info.row.original.releasedCommission, info.row.original.currency)} rilasciate`
            : ""}
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("method", {
    header: "Metodo",
    cell: (info) => <span className="capitalize">{formatUiLabel(info.getValue())}</span>,
  }),
  columnHelper.accessor("reference", {
    header: "Riferimento",
    cell: (info) => (
      <span className="text-sm text-muted-foreground">
        {info.getValue() ?? "Riferimento in attesa"}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Stato",
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor("createdAt", {
    header: "Creato il",
    cell: (info) => formatShortDate(info.getValue()),
  }),
  columnHelper.display({
    id: "actions",
    header: "Azioni",
    cell: (info) => (
      <div className="flex flex-col gap-2">
        <Link
          href={`/admin/payouts/${info.row.original.id}`}
          className="text-sm font-medium underline-offset-4 hover:underline"
        >
          Apri dettaglio
        </Link>
        <PayoutUpdateForm payout={info.row.original} />
      </div>
    ),
  }),
] as ColumnDef<PayoutListItem, unknown>[];

interface PayoutsTableProps {
  data: PayoutListItem[];
}

export function PayoutsTable({ data }: PayoutsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="influencerName"
      searchPlaceholder="Cerca payout"
      emptyTitle="Nessun payout"
      emptyDescription="I batch payout appariranno qui non appena le commissioni verranno elaborate."
      toolbarLabel="Ledger payout"
    />
  );
}
