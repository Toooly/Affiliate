"use client";

import { useMemo } from "react";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Vista mobile degli ultimi 30 giorni su traffico, conversioni e fatturato generati dai creator.
          </p>
        </div>
        <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
          <MetricTile
            label="Fatturato"
            value={formatCurrency(summary.revenue)}
            tone="muted"
            valueSize="sm"
            className="min-h-[108px] p-4"
          />
          <MetricTile
            label="Click"
            value={compactNumber(summary.clicks)}
            tone="muted"
            valueSize="sm"
            className="min-h-[108px] p-4"
          />
        </div>
      </CardHeader>
      <CardContent className="h-[290px] pt-5 md:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
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
                boxShadow: "0 20px 48px -36px rgba(23, 48, 56, 0.18)",
              }}
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
              fill="var(--chart-primary-fill)"
              fillOpacity={1}
              strokeWidth={2.5}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke="var(--chart-secondary)"
              fill="var(--chart-secondary-fill)"
              fillOpacity={1}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
