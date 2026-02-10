"use client";

import { useQuery } from "@tanstack/react-query";
import type { ServerSafe } from "@/lib/types";

export function useServer(serverId: string) {
  return useQuery<ServerSafe>({
    queryKey: ["server", serverId],
    queryFn: async () => {
      const res = await fetch(`/api/servers/${serverId}`);
      if (!res.ok) throw new Error("Server not found");
      return res.json();
    },
    staleTime: 60_000,
  });
}
