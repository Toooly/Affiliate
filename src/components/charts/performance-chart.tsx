"use client";

import { useId, useMemo } from "react";

import { BarChart3 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AutoGrid } from "@/components/shared/auto-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricTile } from "@/components/shared/metric-tile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartPoint } from "@/lib/types";
import { compactNumber, formatCurrency } from "@/lib/utils";

interface PerformanceChartProps {
  title: string;
  data: ChartPoint[];
  valueKey?: "revenue" | "commission";
}

export function PerformanceChart({
  title,
  data,
  valueKey = "revenue",
}: PerformanceChartProps) {
  const chartId = useId().replace(/:/g, "");
  const summary = useMemo(
    () =>
      data.reduce(
        (accumulator, point) => {
          accumulator.revenue += point.revenue;
          accumulator.commission += point.commission;
          accumulator.clicks += point.clicks;
          accumulator.conversions += point.conversions;
          return accumulator;
        },
        { revenue: 0, commission: 0, clicks: 0, conversions: 0 },
      ),
    [data],
  );
  const hasPerformanceData = data.some(
    (point) =>
      point.clicks > 0 ||
      point.conversions > 0 ||
      point.revenue > 0 ||
      point.commission > 0,
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3.5 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Vista mobile degli ultimi 30 giorni su traffico, conversioni e fatturato generati dagli affiliati.
          </p>
        </div>
        <AutoGrid minItemWidth="9.75rem" className="w-full sm:w-auto">
          <MetricTile
            label="Fatturato"
            value={formatCurrency(summary.revenue)}
            tone="muted"
            valueSize="sm"
            valueType="metric"
            className="ui-mini-metric"
          />
          <MetricTile
            label="Click"
            value={compactNumber(summary.clicks)}
            tone="muted"
            valueSize="sm"
            valueType="metric"
            className="ui-mini-metric"
          />
        </AutoGrid>
      </CardHeader>
      {hasPerformanceData ? (
        <CardContent className="h-[250px] pt-4 md:h-[290px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`${chartId}-primary`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-primary)" stopOpacity={0.38} />
                  <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0.04} />
                </linearGradient>
                <linearGradient id={`${chartId}-secondary`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-secondary)" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="var(--chart-secondary)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--chart-grid)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
                tickFormatter={(value) => value.slice(5)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
                tickFormatter={(value) => String(value)}
              />
              <Tooltip
                cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 20,
                  borderColor: "var(--chart-tooltip-border)",
                  background: "var(--chart-tooltip-bg)",
                  boxShadow: "0 28px 56px -34px rgba(16, 20, 30, 0.24)",
                  color: "var(--foreground)",
                }}
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{ color: "var(--secondary-foreground)", fontWeight: 600 }}
                formatter={(value, name) => {
                  const numericValue =
                    typeof value === "number" ? value : Number(value ?? 0);

                  return name === valueKey
                    ? formatCurrency(numericValue)
                    : numericValue;
                }}
              />
              <Area
                type="monotone"
                dataKey={valueKey}
                stroke="var(--chart-primary)"
                fill={`url(#${chartId}-primary)`}
                fillOpacity={1}
                strokeWidth={2.75}
                activeDot={{ r: 4, fill: "var(--chart-primary)", stroke: "white", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="var(--chart-secondary)"
                fill={`url(#${chartId}-secondary)`}
                fillOpacity={1}
                strokeWidth={2.25}
                activeDot={{
                  r: 3.5,
                  fill: "var(--chart-secondary)",
                  stroke: "white",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      ) : (
        <CardContent className="pt-4">
          <EmptyState
            icon={BarChart3}
            title="Nessuna performance registrata"
            description="Il grafico si attivera quando inizieranno ad arrivare click, conversioni o ricavi tracciati in modo reale."
          />
        </CardContent>
      )}
    </Card>
  );
}
