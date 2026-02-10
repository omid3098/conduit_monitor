"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDuration, formatBytes, formatCompact } from "@/lib/format";
import type { AgentSession, AgentSettings } from "@/lib/types";

interface SessionSettingsStripProps {
  session: AgentSession | null;
  settings: AgentSettings | null;
}

function StripItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[80px]">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function SessionSettingsStrip({
  session,
  settings,
}: SessionSettingsStripProps) {
  if (!session && !settings) return null;

  const sessionUptime = session
    ? formatDuration((Date.now() / 1000) - session.start_time)
    : "--";

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {/* Session info */}
          {session && (
            <>
              <StripItem label="Session Uptime" value={sessionUptime} />
              <StripItem
                label="Peak Conns"
                value={formatCompact(session.peak_connections)}
              />
              <StripItem
                label="Avg Conns"
                value={session.avg_connections.toFixed(1)}
              />
              <StripItem
                label="Total Upload"
                value={formatBytes(session.total_upload_bytes)}
              />
              <StripItem
                label="Total Download"
                value={formatBytes(session.total_download_bytes)}
              />
            </>
          )}

          {session && settings && (
            <Separator orientation="vertical" className="h-8" />
          )}

          {/* Settings */}
          {settings && (
            <>
              <StripItem
                label="Max Clients"
                value={formatCompact(settings.max_clients)}
              />
              <StripItem
                label="BW Limit"
                value={
                  settings.bandwidth_limit_mbps > 0
                    ? `${settings.bandwidth_limit_mbps} Mbps`
                    : "None"
                }
              />
              <StripItem
                label="Auto-Start"
                value={
                  <Badge
                    variant={settings.auto_start ? "default" : "outline"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {settings.auto_start ? "On" : "Off"}
                  </Badge>
                }
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
