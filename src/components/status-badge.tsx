"use client";

import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/format";
import type { ServerConnectionState } from "@/lib/types";

const stateConfig: Record<
  ServerConnectionState,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  online: { label: "Online", variant: "default" },
  offline: { label: "Offline", variant: "destructive" },
  auth_failed: { label: "Auth Failed", variant: "destructive" },
  starting_up: { label: "Starting Up", variant: "secondary" },
  stale: { label: "Stale", variant: "outline" },
  never_connected: { label: "Never Connected", variant: "secondary" },
};

interface StatusBadgeProps {
  state: ServerConnectionState;
  lastSeenAt?: string | null;
}

export function StatusBadge({ state, lastSeenAt }: StatusBadgeProps) {
  const config = stateConfig[state];

  if (state === "offline" && lastSeenAt) {
    return (
      <Badge variant={config.variant} className="gap-1">
        Offline
        <span className="text-[10px] opacity-75">
          · {formatRelativeTime(lastSeenAt)}
        </span>
      </Badge>
    );
  }

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
