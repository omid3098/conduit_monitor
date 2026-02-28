"use client";

import { formatCountryCode, formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AgentCountryClients } from "@/lib/types";

interface CountryListSidebarProps {
  countries: AgentCountryClients[];
  className?: string;
}

export function CountryListSidebar({
  countries,
  className,
}: CountryListSidebarProps) {
  const sorted = [...countries].sort((a, b) => b.connections - a.connections);
  const maxConnections = sorted.length > 0 ? sorted[0].connections : 1;
  const total = sorted.reduce((s, c) => s + c.connections, 0);

  return (
    <div
      className={cn(
        "flex flex-col h-full min-h-0 rounded-lg border bg-card/50 p-2",
        className
      )}
    >
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <span className="text-xs font-medium text-muted-foreground">
          Clients by Country
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? "country" : "countries"}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No country data available
        </p>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5">
          {sorted.map((c) => {
            const pct = total > 0 ? (c.connections / total) * 100 : 0;
            const barWidth =
              maxConnections > 0 ? (c.connections / maxConnections) * 100 : 0;
            return (
              <div
                key={c.country}
                className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-accent/10 transition-colors"
              >
                <span className="text-xs truncate w-24 shrink-0">
                  {formatCountryCode(c.country)}
                </span>
                <div className="flex-1 min-w-0 h-3.5 bg-muted/30 rounded-sm overflow-hidden">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: "hsl(142, 70%, 45%)",
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground shrink-0 w-12 text-right">
                  {formatCompact(c.connections)}
                </span>
                <span className="text-[10px] tabular-nums text-muted-foreground/70 shrink-0 w-10 text-right">
                  {pct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
