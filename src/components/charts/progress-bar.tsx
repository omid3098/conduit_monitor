"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  value: number
  max: number
  label?: string
  showValue?: boolean
  height?: number
  thresholds?: { warn: number; danger: number }
}

export function ProgressBar({
  value,
  max,
  label,
  showValue = false,
  height = 8,
  thresholds,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0

  const barColorClass = useMemo(() => {
    if (thresholds) {
      if (value >= thresholds.danger) return "bg-red-500"
      if (value >= thresholds.warn) return "bg-yellow-500"
      return "bg-emerald-500"
    }
    if (pct >= 80) return "bg-red-500"
    if (pct >= 60) return "bg-yellow-500"
    return "bg-emerald-500"
  }, [value, pct, thresholds])

  return (
    <div className="flex flex-col gap-1 w-full">
      {(label || showValue) && (
        <div className="flex items-center justify-between text-xs">
          {label && (
            <span className="text-muted-foreground truncate">{label}</span>
          )}
          {showValue && (
            <span className="tabular-nums text-foreground">
              {value.toLocaleString()} / {max.toLocaleString()}
            </span>
          )}
        </div>
      )}
      <div
        className="w-full rounded-full bg-muted/50 overflow-hidden"
        style={{ height }}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            barColorClass
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
