"use client";

import { useServerUptime, type UptimeRange } from "@/hooks/use-uptime";
import { UptimeBar } from "@/components/uptime/uptime-bar";

const RANGES: { label: string; value: UptimeRange; seconds: number }[] = [
  { label: "24h", value: "24h", seconds: 86400 },
  { label: "7d", value: "7d", seconds: 604800 },
  { label: "30d", value: "30d", seconds: 2592000 },
];

function UptimePercent({
  value,
  label,
}: {
  value: number | undefined;
  label: string;
}) {
  const color =
    value === undefined
      ? "text-muted-foreground"
      : value >= 99.9
        ? "text-emerald-500"
        : value >= 99
          ? "text-yellow-500"
          : "text-red-500";

  return (
    <div className="text-center">
      <p className={`text-lg font-bold tabular-nums ${color}`}>
        {value !== undefined ? `${value.toFixed(1)}%` : "—"}
      </p>
      <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

interface UptimeSummaryProps {
  serverId: string;
}

export function UptimeSummary({ serverId }: UptimeSummaryProps) {
  const q24h = useServerUptime(serverId, "24h");
  const q7d = useServerUptime(serverId, "7d");
  const q30d = useServerUptime(serverId, "30d");

  const queries = [q24h, q7d, q30d];

  // Use the 30d data for the bar (most comprehensive)
  const barData = q30d.data;

  return (
    <div className="rounded-xl border bg-card/50 p-4 space-y-3">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Uptime
      </h3>

      <div className="flex items-center justify-around">
        {RANGES.map((r, i) => (
          <UptimePercent
            key={r.value}
            value={queries[i].data?.uptime_percent}
            label={r.label}
          />
        ))}
      </div>

      {barData && (
        <UptimeBar
          rangeSeconds={2592000}
          incidents={barData.downtime_incidents}
          segments={90}
        />
      )}

      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>30 days ago</span>
        <span>Now</span>
      </div>
    </div>
  );
}
