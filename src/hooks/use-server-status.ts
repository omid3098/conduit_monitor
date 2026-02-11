"use client";

import { useQuery } from "@tanstack/react-query";
import type { ServerStatusResult, ServerConnectionState } from "@/lib/types";
import { POLL_INTERVAL_MS } from "@/lib/constants";

class StatusError extends Error {
  constructor(
    public state: ServerConnectionState,
    public statusCode: number,
    public lastSeenAt?: string | null,
    public firstSeenAt?: string | null
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

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        let state: ServerConnectionState = "offline";
        if (res.status === 401) state = "auth_failed";
        else if (res.status === 503) state = "starting_up";

        throw new StatusError(state, res.status, body.last_seen_at, body.first_seen_at);
      }

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
  let lastSeenAt: string | null = null;

  if (query.error) {
    if (query.error instanceof StatusError) {
      // Derive "never_connected" if offline and server has never been seen
      if (
        (query.error.state === "offline") &&
        !query.error.firstSeenAt
      ) {
        connectionState = "never_connected";
      } else {
        connectionState = query.error.state;
      }
      lastSeenAt = query.error.lastSeenAt ?? null;
    } else {
      connectionState = "offline";
    }
  } else if (query.data?.stale) {
    connectionState = "stale";
  }

  return {
    data: query.data,
    connectionState,
    isLoading: query.isLoading,
    error: query.error,
    lastSeenAt,
  };
}
