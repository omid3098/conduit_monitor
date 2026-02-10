"use client";

import Link from "next/link";
import { useServerStatus } from "@/hooks/use-server-status";
import type { ServerSafe, ServerConnectionState } from "@/lib/types";
import { formatCpu, formatBytes } from "@/lib/format";

const statusDotColors: Record<ServerConnectionState, string> = {
  online: "bg-emerald-500",
  offline: "bg-red-500",
  auth_failed: "bg-red-500",
  starting_up: "bg-yellow-500",
  stale: "bg-yellow-500",
};

function MiniHealthBar({ label, percent }: { label: string; percent: number }) {
  const clamped = Math.min(percent, 100);
  const colorClass =
    clamped > 80
      ? "bg-red-500"
      : clamped > 60
        ? "bg-yellow-500"
        : "bg-emerald-500";

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-7">{label}</span>
      <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground w-9 text-right">
        {formatCpu(percent)}
      </span>
    </div>
  );
}

export function CompactServerCard({ server }: { server: ServerSafe }) {
  const { data, connectionState, isLoading } = useServerStatus(server.id);

  const displayName =
    server.label || server.server_id || server.id.slice(0, 8);

  const isUp = connectionState === "online" || connectionState === "stale";
  const connected = data?.connected_clients ?? 0;
  const connecting = data?.connecting_clients ?? 0;
  const maxClients = (data?.settings?.max_clients ?? 0) > 0
    ? data!.settings!.max_clients
    : (data?.containers?.reduce((s, c) => s + (c.settings?.max_clients ?? 0), 0) ?? 0);
  const containers = data?.total_containers ?? 0;
  const sessionUp = data?.session?.total_upload_bytes ?? 0;
  const sessionDown = data?.session?.total_download_bytes ?? 0;
  const cpuPct = data?.system?.cpu_percent ?? 0;
  const memPct =
    data?.system && data.system.memory_total_mb > 0
      ? (data.system.memory_used_mb / data.system.memory_total_mb) * 100
      : 0;

  return (
    <Link href={`/servers/${server.id}`} className="block">
      <div className="rounded-lg border bg-card hover:bg-accent/5 transition-colors px-4 py-3 h-full">
        {/* Header: status dot + name */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`size-2.5 rounded-full shrink-0 ${statusDotColors[connectionState]}`}
          />
          <span className="text-sm font-medium truncate">{displayName}</span>
        </div>

        {isLoading ? (
          <div className="h-12 bg-muted/20 rounded animate-pulse" />
        ) : isUp && data ? (
          <>
            {/* Client counts */}
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-2xl font-bold tabular-nums">
                {connected}
              </span>
              {maxClients > 0 && (
                <span className="text-sm text-muted-foreground tabular-nums">
                  /{maxClients}
                </span>
              )}
              <span className="text-xs text-muted-foreground">connected</span>
              {connecting > 0 && (
                <>
                  <span className="text-lg font-semibold tabular-nums text-muted-foreground">
                    {connecting}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    connecting
                  </span>
                </>
              )}
            </div>

            {/* Session traffic + containers */}
            <div className="flex items-center gap-1.5 mb-2 text-[10px] text-muted-foreground tabular-nums">
              <span>{containers}C</span>
              <span className="text-border">|</span>
              <span>↑{formatBytes(sessionUp)}</span>
              <span>↓{formatBytes(sessionDown)}</span>
            </div>

            {/* Health bars */}
            <div className="space-y-1.5">
              <MiniHealthBar label="CPU" percent={cpuPct} />
              <MiniHealthBar label="RAM" percent={memPct} />
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {connectionState === "offline"
              ? "Unreachable"
              : connectionState === "auth_failed"
                ? "Auth failed"
                : connectionState === "starting_up"
                  ? "Starting..."
                  : "No data"}
          </p>
        )}
      </div>
    </Link>
  );
}
