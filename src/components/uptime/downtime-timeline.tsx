"use client";

import { formatDuration } from "@/lib/format";
import type { DowntimeIncident } from "@/lib/types";

interface DowntimeTimelineProps {
  incidents: DowntimeIncident[];
}

function formatTimestamp(epoch: number): string {
  return new Date(epoch * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DowntimeTimeline({ incidents }: DowntimeTimelineProps) {
  if (incidents.length === 0) {
    return (
      <div className="rounded-xl border bg-card/50 p-4">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Downtime Incidents
        </h3>
        <p className="text-sm text-muted-foreground">
          No downtime incidents in this period.
        </p>
      </div>
    );
  }

  // Most recent first
  const sorted = [...incidents].sort((a, b) => b.start - a.start);

  return (
    <div className="rounded-xl border bg-card/50 p-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Downtime Incidents ({incidents.length})
      </h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {sorted.map((incident, i) => (
          <div
            key={i}
            className="flex items-center gap-3 text-sm py-1.5 border-b border-border/30 last:border-b-0"
          >
            <span className="size-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-xs tabular-nums">
              {formatTimestamp(incident.start)}
            </span>
            <span className="text-muted-foreground text-xs">→</span>
            <span className="text-xs tabular-nums">
              {incident.end ? formatTimestamp(incident.end) : "Ongoing"}
            </span>
            <span className="ml-auto text-xs font-medium tabular-nums text-muted-foreground">
              {formatDuration(incident.duration)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
