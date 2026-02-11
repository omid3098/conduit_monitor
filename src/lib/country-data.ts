import type { AgentCountryClients, AgentCountryTraffic } from "@/lib/types";
import { formatCountryCode } from "@/lib/format";

export interface CountryMapData {
  countryCode: string;
  countryName: string;
  connections: number;
  trafficIn?: number;
  trafficOut?: number;
}

export function mergeCountryData(
  clients: AgentCountryClients[],
  traffic?: AgentCountryTraffic[]
): CountryMapData[] {
  const map = new Map<string, CountryMapData>();

  for (const c of clients) {
    const code = c.country.toUpperCase();
    map.set(code, {
      countryCode: code,
      countryName: formatCountryCode(c.country),
      connections: c.connections,
    });
  }

  if (traffic) {
    for (const t of traffic) {
      const code = t.country.toUpperCase();
      const existing = map.get(code);
      if (existing) {
        existing.trafficIn = t.from_bytes;
        existing.trafficOut = t.to_bytes;
      }
    }
  }

  return Array.from(map.values());
}
