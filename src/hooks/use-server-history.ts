"use client";

import { useQuery } from "@tanstack/react-query";
import type { MetricsHistoryResponse } from "@/lib/types";

export type TimeRange = "1h" | "6h" | "24h";

export function useServerHistory(serverId: string, range: TimeRange = "1h") {
  return useQuery<MetricsHistoryResponse>({
    queryKey: ["server-history", serverId, range],
    queryFn: async () => {
      const res = await fetch(
        `/api/servers/${serverId}/history?range=${range}`
      );
      if (!res.ok) throw new Error("Failed to fetch history");
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
