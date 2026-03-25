"use client";

import * as React from "react";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";

import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, Search } from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchColumnId?: string;
  emptyTitle: string;
  emptyDescription: string;
  toolbarLabel?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder,
  searchColumnId,
  emptyTitle,
  emptyDescription,
  toolbarLabel = "Tabella operativa",
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<
    { id: string; value: unknown }[]
  >([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[28px] border border-border/80 bg-card/92 p-4 shadow-[0_20px_52px_-38px_rgba(22,48,56,0.1)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.18em] text-foreground uppercase">
            {toolbarLabel}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} visibili su {data.length} totali
          </div>
        </div>
        {searchColumnId ? (
          <div className="relative max-w-sm flex-1 sm:max-w-[320px]">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder ?? "Cerca"}
              value={(table.getColumn(searchColumnId)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchColumnId)?.setFilterValue(event.target.value)
              }
              className="pl-11"
            />
          </div>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-[30px] border border-border/80 bg-card/95 shadow-[0_22px_56px_-40px_rgba(17,17,17,0.12)]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : header.column.getCanSort() ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-2 text-left"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <ArrowUpDown className="size-3.5 text-muted-foreground" />
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-6">
                  <EmptyState
                    icon={Search}
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
