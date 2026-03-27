"use client";

import Link from "next/link";

import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";

import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/tables/data-table";
import type { ConversionListItem } from "@/lib/types";
import { formatCurrency, formatShortDate } from "@/lib/utils";

const columnHelper = createColumnHelper<ConversionListItem>();

const columns = [
  columnHelper.accessor("orderId", {
    header: "Ordine",
    cell: (info) => (
      <div>
        <div className="font-medium">{info.getValue()}</div>
        <div className="ui-wrap-pretty text-sm text-muted-foreground">
          {info.row.original.customerEmail || "Inserimento manuale"}
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("influencerName", {
    header: "Affiliato",
    cell: (info) => (
      <div>
        <div className="font-medium">{info.getValue()}</div>
        <div className="ui-wrap-pretty text-sm text-muted-foreground">
          {info.row.original.referralCode ? `/${info.row.original.referralCode}` : "Nessun link"}
        </div>
        <div className="ui-wrap-pretty text-xs text-muted-foreground">
          {info.row.original.promoCode ? `Codice ${info.row.original.promoCode}` : "Nessun codice"}
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("campaignName", {
    header: "Campagna",
    cell: (info) => (
      <span className="ui-wrap-pretty text-sm text-muted-foreground">
        {info.getValue() ?? "Nessuna campagna"}
      </span>
    ),
  }),
  columnHelper.accessor("attributionLabel", {
    header: "Attribuzione",
    cell: (info) => (
      <span className="ui-wrap-pretty capitalize text-sm text-muted-foreground">
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor("orderAmount", {
    header: "Importo",
    cell: (info) => formatCurrency(info.getValue(), info.row.original.currency),
  }),
  columnHelper.accessor("commissionAmount", {
    header: "Commissione",
    cell: (info) => formatCurrency(info.getValue(), info.row.original.currency),
  }),
  columnHelper.display({
    id: "payout",
    header: "Payout",
    cell: (info) =>
      info.row.original.payoutId ? (
        <div>
        <Link
          href={`/admin/payouts/${info.row.original.payoutId}`}
          className="font-medium underline-offset-4 hover:underline"
        >
          {info.row.original.payoutStatus?.replaceAll("_", " ") ?? "Allocato"}
        </Link>
          <div className="ui-wrap-pretty text-xs text-muted-foreground">
            {info.row.original.payoutReference ?? "Riferimento in attesa"}
          </div>
        </div>
      ) : (
        <span className="ui-wrap-pretty text-sm text-muted-foreground">
          {info.row.original.status === "approved" ? "Pronta per payout" : "Non allocata"}
        </span>
      ),
  }),
  columnHelper.accessor("status", {
    header: "Stato",
    cell: (info) => (
      <div className="space-y-2">
        <StatusBadge status={info.getValue()} />
        {info.row.original.suspiciousEventsCount ? (
          <StatusBadge status={`${info.row.original.suspiciousEventsCount} risk`} />
        ) : null}
      </div>
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: "Data",
    cell: (info) => formatShortDate(info.getValue()),
  }),
] as ColumnDef<ConversionListItem, unknown>[];

interface ConversionsTableProps {
  data: ConversionListItem[];
}

export function ConversionsTable({ data }: ConversionsTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="orderId"
      searchPlaceholder="Cerca ordini"
      emptyTitle="Nessuna conversione"
      emptyDescription="Usa il form qui sopra per registrare la prima conversione."
      toolbarLabel="Registro conversioni"
    />
  );
}
