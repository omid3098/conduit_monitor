"use client"

import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
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

interface AreaChartProps {
  data: Array<Record<string, unknown>>
  series: SeriesConfig[]
  xKey?: string
  yUnit?: string
  height?: number
}

export function AreaChart({
  data,
  series,
  xKey = "time",
  yUnit,
  height = 250,
}: AreaChartProps) {
  const chartConfig: ChartConfig = Object.fromEntries(
    series.map((s) => [
      s.dataKey,
      { label: s.label, color: s.color },
    ])
  )

  return (
    <ChartContainer config={chartConfig} style={{ height, width: "100%" }}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        stackOffset="none"
      >
        <defs>
          {series.map((s) => (
            <linearGradient
              key={`gradient-${s.dataKey}`}
              id={`fill-${s.dataKey}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={`var(--color-${s.dataKey})`}
                stopOpacity={0.4}
              />
              <stop
                offset="95%"
                stopColor={`var(--color-${s.dataKey})`}
                stopOpacity={0.05}
              />
            </linearGradient>
          ))}
        </defs>
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
          <Area
            key={s.dataKey}
            type="monotone"
            dataKey={s.dataKey}
            stackId="1"
            stroke={`var(--color-${s.dataKey})`}
            strokeWidth={2}
            fill={`url(#fill-${s.dataKey})`}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </RechartsAreaChart>
    </ChartContainer>
  )
}
