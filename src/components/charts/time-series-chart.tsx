"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface SeriesConfig {
  dataKey: string
  label: string
  color: string
}

interface TimeSeriesChartProps {
  data: Array<Record<string, unknown>>
  series: SeriesConfig[]
  xKey?: string
  yUnit?: string
  height?: number
}

export function TimeSeriesChart({
  data,
  series,
  xKey = "time",
  yUnit,
  height = 250,
}: TimeSeriesChartProps) {
  const chartConfig: ChartConfig = Object.fromEntries(
    series.map((s) => [
      s.dataKey,
      { label: s.label, color: s.color },
    ])
  )

  return (
    <ChartContainer config={chartConfig} style={{ height, width: "100%" }}>
      <LineChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={xKey}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          fontSize={11}
          unit={yUnit ? ` ${yUnit}` : undefined}
          width={48}
        />
        <ChartTooltip
          cursor={{ strokeDasharray: "3 3" }}
          content={<ChartTooltipContent />}
        />
        {series.map((s) => (
          <Line
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            stroke={`var(--color-${s.dataKey})`}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  )
}
