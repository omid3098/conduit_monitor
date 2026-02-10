"use client";

import { CountryPanel } from "@/components/server-detail/country-panel";
import type {
  AgentCountryClients,
  ServerStatusResult,
  ServerConnectionState,
} from "@/lib/types";

interface CombinedCountryPanelProps {
  serversData: Array<{
    data: ServerStatusResult | undefined;
    connectionState: ServerConnectionState;
  }>;
  compact?: boolean;
}

export function CombinedCountryPanel({
  serversData,
  compact,
}: CombinedCountryPanelProps) {
  const countryMap = new Map<string, number>();
  for (const server of serversData) {
    if (
      (server.connectionState === "online" ||
        server.connectionState === "stale") &&
      server.data?.clients_by_country
    ) {
      for (const c of server.data.clients_by_country) {
        countryMap.set(
          c.country,
          (countryMap.get(c.country) ?? 0) + c.connections
        );
      }
    }
  }
  const merged: AgentCountryClients[] = Array.from(countryMap.entries())
    .map(([country, connections]) => ({ country, connections }))
    .sort((a, b) => b.connections - a.connections);

  return <CountryPanel countries={merged} compact={compact} />;
}
