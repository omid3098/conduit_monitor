"use client";

import { useQuery } from "@tanstack/react-query";
import type { ServerStatusResult, ServerConnectionState } from "@/lib/types";
import { POLL_INTERVAL_MS } from "@/lib/constants";

class StatusError extends Error {
  constructor(
    public state: ServerConnectionState,
    public statusCode: number
  ) {
    super(`Server returned ${statusCode}: ${state}`);
    this.name = "StatusError";
  }
}

export function useServerStatus(serverId: string) {
  const query = useQuery<ServerStatusResult>({
    queryKey: ["server-status", serverId],
    queryFn: async () => {
      const res = await fetch(`/api/servers/${serverId}/status`);

      if (res.status === 401) throw new StatusError("auth_failed", 401);
      if (res.status === 503) throw new StatusError("starting_up", 503);
      if (res.status === 504) throw new StatusError("offline", 504);
      if (!res.ok) throw new StatusError("offline", res.status);

      return res.json();
    },
    refetchInterval: POLL_INTERVAL_MS,
    retry: (failureCount, error) => {
      if (error instanceof StatusError && error.statusCode === 401) return false;
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30_000),
  });

  let connectionState: ServerConnectionState = "online";

  if (query.error) {
    connectionState =
      query.error instanceof StatusError ? query.error.state : "offline";
  } else if (query.data?.stale) {
    connectionState = "stale";
  }

  return {
    data: query.data,
    connectionState,
    isLoading: query.isLoading,
    error: query.error,
  };
}
