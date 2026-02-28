"use client";

import { WorldMap } from "@/components/world-map/world-map";
import { mergeCountryData } from "@/lib/country-data";
import { cn } from "@/lib/utils";
import type { AgentCountryClients, AgentCountryTraffic } from "@/lib/types";

interface WorldMapPanelProps {
  countries: AgentCountryClients[];
  traffic?: AgentCountryTraffic[];
  className?: string;
}

export function WorldMapPanel({
  countries,
  traffic,
  className,
}: WorldMapPanelProps) {
  const data = mergeCountryData(countries, traffic);

  return (
    <div
      className={cn("rounded-xl border bg-card/50 p-4 h-full", className)}
    >
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        Client Map
      </h3>
      {data.length > 0 ? (
        <WorldMap data={data} />
      ) : (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          No country data available
        </div>
      )}
    </div>
  );
}
