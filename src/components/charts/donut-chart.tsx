"use client"

import { useMemo } from "react"
import { Cell, Pie, PieChart } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface DonutDataItem {
  name: string
  value: number
  color?: string
}

interface DonutChartProps {
  data: DonutDataItem[]
  height?: number
}

const defaultColors = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
]

export function DonutChart({ data, height = 200 }: DonutChartProps) {
  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  )

  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((d, i) => [
      d.name,
      {
        label: `${d.name} (${total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%)`,
        color: d.color || defaultColors[i % defaultColors.length],
      },
    ])
  )

  const chartData = data.map((d, i) => ({
    ...d,
    fill: d.color || defaultColors[i % defaultColors.length],
  }))

  return (
    <ChartContainer config={chartConfig} style={{ height, width: "100%" }}>
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              nameKey="name"
              formatter={(value, name) => {
                const pct = total > 0 ? (((value as number) / total) * 100).toFixed(1) : "0"
                return (
                  <span className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">{name}</span>
                    <span className="font-mono font-medium tabular-nums">
                      {(value as number).toLocaleString()} ({pct}%)
                    </span>
                  </span>
                )
              }}
            />
          }
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="85%"
          strokeWidth={2}
          stroke="var(--background)"
          isAnimationActive={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
      </PieChart>
    </ChartContainer>
  )
}
