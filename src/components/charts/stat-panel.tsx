"use client"

import { Line, LineChart } from "recharts"
import { cn } from "@/lib/utils"

interface StatPanelProps {
  label: string
  value: string
  subtitle?: string
  sparklineData?: number[]
  trend?: "up" | "down" | "neutral"
  color?: string
  thresholdColor?: string
}

const trendArrows: Record<string, string> = {
  up: "\u2191",
  down: "\u2193",
  neutral: "\u2192",
}

const trendColors: Record<string, string> = {
  up: "text-emerald-400",
  down: "text-red-400",
  neutral: "text-muted-foreground",
}

export function StatPanel({
  label,
  value,
  subtitle,
  sparklineData,
  trend,
  color = "var(--color-chart-1)",
  thresholdColor,
}: StatPanelProps) {
  const displayColor = thresholdColor || color

  const chartData = sparklineData?.map((v, i) => ({ i, v })) ?? []

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-lg border border-border/50 bg-card px-4 py-3 min-h-[100px]">
      {/* Label */}
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground z-10">
        {label}
      </span>

      {/* Sparkline behind value */}
      {chartData.length > 1 && (
        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
          <LineChart
            width={200}
            height={60}
            data={chartData}
            margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
          >
            <Line
              type="monotone"
              dataKey="v"
              stroke={displayColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </div>
      )}

      {/* Value */}
      <span
        className="z-10 text-2xl font-bold tabular-nums leading-tight mt-1"
        style={{ color: displayColor }}
      >
        {value}
      </span>

      {/* Subtitle / Trend */}
      <div className="z-10 flex items-center gap-1 mt-0.5">
        {trend && (
          <span className={cn("text-xs font-medium", trendColors[trend])}>
            {trendArrows[trend]}
          </span>
        )}
        {subtitle && (
          <span className="text-[10px] text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </div>
  )
}
