"use client";

import { useQuery } from "@tanstack/react-query";
import type { UptimeResponse, FleetUptimeResponse } from "@/lib/types";

export type UptimeRange = "24h" | "7d" | "30d";

export function useServerUptime(serverId: string, range: UptimeRange = "24h") {
  return useQuery<UptimeResponse>({
    queryKey: ["server-uptime", serverId, range],
    queryFn: async () => {
      const res = await fetch(`/api/servers/${serverId}/uptime?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch uptime");
      return res.json();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useFleetUptime(range: UptimeRange = "24h") {
  return useQuery<FleetUptimeResponse>({
    queryKey: ["fleet-uptime", range],
    queryFn: async () => {
      const res = await fetch(`/api/uptime?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch fleet uptime");
      return res.json();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
