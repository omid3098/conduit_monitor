"use client";

import { useMemo } from "react";
import type { DowntimeIncident } from "@/lib/types";

interface UptimeBarProps {
  rangeSeconds: number;
  incidents: DowntimeIncident[];
  segments?: number;
}

export function UptimeBar({
  rangeSeconds,
  incidents,
  segments = 90,
}: UptimeBarProps) {
  const now = Math.floor(Date.now() / 1000);
  const rangeStart = now - rangeSeconds;
  const segDuration = rangeSeconds / segments;

  const segmentStates = useMemo(() => {
    return Array.from({ length: segments }, (_, i) => {
      const segStart = rangeStart + i * segDuration;
      const segEnd = segStart + segDuration;

      // Check if any incident overlaps this segment
      const hasDowntime = incidents.some((inc) => {
        const incEnd = inc.end ?? now;
        return incEnd > segStart && inc.start < segEnd;
      });

      return hasDowntime ? "down" : "up";
    });
  }, [rangeStart, segDuration, segments, incidents, now]);

  const formatSegTime = (index: number) => {
    const t = new Date((rangeStart + index * segDuration) * 1000);
    return t.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex gap-px h-8 w-full" title="Uptime history">
      {segmentStates.map((state, i) => (
        <div
          key={i}
          className={`flex-1 rounded-[2px] transition-colors ${
            state === "up"
              ? "bg-emerald-500 hover:bg-emerald-400"
              : "bg-red-500 hover:bg-red-400"
          }`}
          title={`${formatSegTime(i)} — ${state === "up" ? "Online" : "Downtime"}`}
        />
      ))}
    </div>
  );
}
