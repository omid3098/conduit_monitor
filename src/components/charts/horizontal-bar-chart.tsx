"use client"

import { useMemo } from "react"

interface HorizontalBarItem {
  label: string
  value: number
}

interface HorizontalBarChartProps {
  data: HorizontalBarItem[]
  maxItems?: number
  height?: number
}

export function HorizontalBarChart({
  data,
  maxItems = 8,
  height,
}: HorizontalBarChartProps) {
  const { items, total, maxValue } = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value).slice(0, maxItems)
    const total = data.reduce((sum, d) => sum + d.value, 0)
    const maxValue = sorted.length > 0 ? sorted[0].value : 0
    return { items: sorted, total, maxValue }
  }, [data, maxItems])

  const rowHeight = 28
  const computedHeight = height ?? items.length * rowHeight + 4

  return (
    <div className="flex flex-col gap-1" style={{ height: computedHeight }}>
      {items.map((item) => {
        const widthPct = maxValue > 0 ? (item.value / maxValue) * 100 : 0
        const totalPct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0"

        return (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <span className="w-20 truncate text-right text-muted-foreground shrink-0">
              {item.label}
            </span>
            <div className="relative flex-1 h-4 rounded-sm bg-muted/40 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-chart-1 transition-all duration-300"
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="w-16 text-right tabular-nums text-foreground shrink-0">
              {item.value.toLocaleString()}
            </span>
            <span className="w-10 text-right tabular-nums text-muted-foreground shrink-0">
              {totalPct}%
            </span>
          </div>
        )
      })}
    </div>
  )
}
