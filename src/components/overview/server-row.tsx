"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { useServerStatus } from "@/hooks/use-server-status";
import type { ServerSafe } from "@/lib/types";
import { formatCpu, formatMemory, formatMbps, formatBytes } from "@/lib/format";

interface SparklineData {
  cpu: number;
  connections: number;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 24;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="opacity-50">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MiniGauge({
  percent,
  label,
  detail,
}: {
  percent: number;
  label: string;
  detail?: string;
}) {
  const clamped = Math.min(percent, 100);
  const color =
    clamped > 80
      ? "text-red-500"
      : clamped > 60
        ? "text-yellow-500"
        : "text-emerald-500";
  const strokeColor =
    clamped > 80
      ? "stroke-red-500"
      : clamped > 60
        ? "stroke-yellow-500"
        : "stroke-emerald-500";

  const r = 24;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <svg width="56" height="56" className="-rotate-90">
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-muted/20"
        />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={strokeColor}
        />
      </svg>
      <span className={`text-xs font-bold -mt-9 ${color}`}>
        {formatCpu(percent)}
      </span>
      {detail && (
        <span className="text-[10px] text-muted-foreground mt-4">
          {detail}
        </span>
      )}
    </div>
  );
}

function MiniCountryBars({
  countries,
}: {
  countries: { country: string; connections: number }[];
}) {
  const top3 = countries.slice(0, 3);
  if (top3.length === 0) return <span className="text-xs text-muted-foreground">No data</span>;
  const maxVal = top3[0]?.connections || 1;

  return (
    <div className="space-y-1">
      {top3.map((c) => (
        <div key={c.country} className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono w-5 text-muted-foreground">
            {c.country}
          </span>
          <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-chart-1 rounded-full"
              style={{ width: `${(c.connections / maxVal) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ServerRow({ server }: { server: ServerSafe }) {
  const { data, connectionState, isLoading } = useServerStatus(server.id);
  const historyRef = useRef<SparklineData[]>([]);

  const displayName =
    server.label || server.server_id || server.id.slice(0, 8);

  useEffect(() => {
    if (data) {
      const connections = (data.connected_clients ?? 0) + (data.connecting_clients ?? 0);
      const cpu = data.system?.cpu_percent ?? 0;
      historyRef.current = [
        ...historyRef.current.slice(-19),
        { cpu, connections },
      ];
    }
  }, [data]);

  const dimmed =
    connectionState !== "online" && connectionState !== "stale"
      ? "opacity-40"
      : "";

  return (
    <Link href={`/servers/${server.id}`} className="block">
      <div className="rounded-lg border bg-card hover:bg-accent/5 transition-colors">
        {/* Server header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
          <span className="text-sm font-medium">{displayName}</span>
          <StatusBadge state={connectionState} />
        </div>

        {/* Metrics row */}
        <div className={`px-4 py-3 ${dimmed}`}>
          {isLoading ? (
            <div className="flex gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-14 flex-1 bg-muted/20 rounded animate-pulse"
                />
              ))}
            </div>
          ) : data ? (
            <div className="grid grid-cols-5 gap-4 items-center">
              {/* Clients stat panel */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground">
                  Clients
                </span>
                <div className="text-xl font-bold tabular-nums">
                  {(data.connected_clients ?? 0) + (data.connecting_clients ?? 0)}
                </div>
                <MiniSparkline
                  data={historyRef.current.map((h) => h.connections)}
                  color="hsl(var(--chart-1))"
                />
                <span className="text-[10px] text-muted-foreground">
                  {data.connected_clients ?? 0} conn, {data.connecting_clients ?? 0} connecting
                </span>
              </div>

              {/* Traffic stat panel */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground">
                  Traffic
                </span>
                <div className="text-sm font-medium tabular-nums">
                  <span className="text-emerald-500">
                    ↑{data.system ? formatMbps(data.system.net_out_mbps) : "—"}
                  </span>
                  <br />
                  <span className="text-blue-500">
                    ↓{data.system ? formatMbps(data.system.net_in_mbps) : "—"}
                  </span>
                </div>
                {data.session && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatBytes(data.session.total_upload_bytes)} total
                  </span>
                )}
              </div>

              {/* CPU gauge */}
              <MiniGauge
                percent={data.system?.cpu_percent ?? 0}
                label="CPU"
              />

              {/* RAM gauge */}
              <MiniGauge
                percent={
                  data.system
                    ? (data.system.memory_used_mb /
                        data.system.memory_total_mb) *
                      100
                    : 0
                }
                label="RAM"
                detail={
                  data.system
                    ? `${formatMemory(data.system.memory_used_mb)}/${formatMemory(data.system.memory_total_mb)}`
                    : undefined
                }
              />

              {/* Countries */}
              <div className="space-y-1">
                <span className="text-[10px] uppercase text-muted-foreground">
                  Countries
                </span>
                <MiniCountryBars
                  countries={data.clients_by_country ?? []}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {connectionState === "offline"
                ? "Server unreachable"
                : connectionState === "auth_failed"
                  ? "Authentication failed"
                  : connectionState === "starting_up"
                    ? "Starting up..."
                    : "No data"}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
