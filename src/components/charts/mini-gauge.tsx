"use client"

import { RadialBar, RadialBarChart } from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"

interface MiniGaugeProps {
  value: number
  max: number
  label: string
  unit?: string
  size?: number
}

function getGaugeColor(pct: number): string {
  if (pct < 60) return "hsl(142, 71%, 45%)"   // green
  if (pct < 80) return "hsl(48, 96%, 53%)"     // yellow
  return "hsl(0, 84%, 60%)"                     // red
}

export function MiniGauge({
  value,
  max,
  label,
  unit = "",
  size = 80,
}: MiniGaugeProps) {
  const pct = max > 0 ? (value / max) * 100 : 0
  const color = getGaugeColor(pct)

  const chartData = [
    { name: "value", value: pct, fill: color },
  ]

  const chartConfig: ChartConfig = {
    value: {
      label,
      color,
    },
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <ChartContainer
        config={chartConfig}
        className="aspect-square"
        style={{ width: size, height: size }}
      >
        <RadialBarChart
          data={chartData}
          startAngle={225}
          endAngle={-45}
          innerRadius="70%"
          outerRadius="100%"
          barSize={6}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={4}
            background={{ fill: "hsl(var(--muted))" }}
            isAnimationActive={false}
          />
        </RadialBarChart>
      </ChartContainer>
      <div className="flex flex-col items-center -mt-[calc(50%+8px)]">
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color }}
        >
          {value}{unit}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1 leading-none">
        {label}
      </span>
    </div>
  )
}
