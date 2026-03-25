"use client";

import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";

import { PromoAssetForm } from "@/components/forms/promo-asset-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/tables/data-table";
import type { PromoAsset } from "@/lib/types";
import { formatShortDate, formatUiLabel } from "@/lib/utils";

interface AssetsTableProps {
  data: PromoAsset[];
  campaigns: Array<{ id: string; name: string }>;
}

export function AssetsTable({ data, campaigns }: AssetsTableProps) {
  const columnHelper = createColumnHelper<PromoAsset>();
  const columns = [
    columnHelper.accessor("title", {
      header: "Asset",
      cell: (info) => (
        <div>
          <div className="font-medium">{info.getValue()}</div>
          <div className="text-sm text-muted-foreground">
            {info.row.original.description}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("type", {
      header: "Tipo",
      cell: (info) => <span className="capitalize">{formatUiLabel(info.getValue())}</span>,
    }),
    columnHelper.display({
      id: "campaign",
      header: "Campagna",
      cell: (info) => {
        const campaign = campaigns.find(
          (candidate) => candidate.id === info.row.original.campaignId,
        );

        return (
          <span className="text-sm text-muted-foreground">
            {campaign?.name ?? "Libreria generale"}
          </span>
        );
      },
    }),
    columnHelper.accessor("isActive", {
      header: "Stato",
      cell: (info) => <StatusBadge status={info.getValue() ? "active" : "inactive"} />,
    }),
    columnHelper.accessor("createdAt", {
      header: "Creato il",
      cell: (info) => formatShortDate(info.getValue()),
    }),
    columnHelper.display({
      id: "actions",
      header: "Azioni",
      cell: (info) => <PromoAssetForm asset={info.row.original} campaigns={campaigns} />,
    }),
  ] as ColumnDef<PromoAsset, unknown>[];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchColumnId="title"
      searchPlaceholder="Cerca asset"
      emptyTitle="Nessun asset promo"
      emptyDescription="Aggiungi il primo asset per rendere disponibili i materiali creativi nelle dashboard creator."
      toolbarLabel="Libreria asset creativi"
    />
  );
}
