"use client";

import { useQuery } from "@tanstack/react-query";
import type { AggregatedHistoryResponse } from "@/lib/types";
import type { TimeRange } from "@/hooks/use-server-history";

export function useAggregatedHistory(range: TimeRange = "1h") {
  return useQuery<AggregatedHistoryResponse>({
    queryKey: ["aggregated-history", range],
    queryFn: async () => {
      const res = await fetch(`/api/history?range=${range}`);
      if (!res.ok) throw new Error("Failed to fetch aggregated history");
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
