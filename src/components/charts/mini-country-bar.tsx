"use client"

import { useMemo } from "react"

interface CountryEntry {
  country: string
  connections: number
}

interface MiniCountryBarProps {
  countries: CountryEntry[]
  max?: number
}

export function MiniCountryBar({
  countries,
  max = 3,
}: MiniCountryBarProps) {
  const items = useMemo(() => {
    return [...countries]
      .sort((a, b) => b.connections - a.connections)
      .slice(0, max)
  }, [countries, max])

  const maxConnections = items.length > 0 ? items[0].connections : 0

  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => {
        const widthPct =
          maxConnections > 0
            ? (item.connections / maxConnections) * 100
            : 0

        return (
          <div
            key={item.country}
            className="flex items-center gap-1.5 text-[10px]"
          >
            <span className="w-5 text-right font-medium text-muted-foreground uppercase shrink-0">
              {item.country.slice(0, 2)}
            </span>
            <div className="relative flex-1 h-2 rounded-sm bg-muted/40 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-sm bg-chart-2 transition-all duration-300"
                style={{ width: `${widthPct}%` }}
              />
            </div>
            <span className="w-6 text-right tabular-nums text-muted-foreground shrink-0">
              {item.connections}
            </span>
          </div>
        )
      })}
      {items.length === 0 && (
        <span className="text-[10px] text-muted-foreground">No data</span>
      )}
    </div>
  )
}
