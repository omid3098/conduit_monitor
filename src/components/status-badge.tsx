"use client";

import { Badge } from "@/components/ui/badge";
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
};

export function StatusBadge({ state }: { state: ServerConnectionState }) {
  const config = stateConfig[state];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
