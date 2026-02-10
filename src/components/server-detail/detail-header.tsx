"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { formatDuration } from "@/lib/format";
import type { ServerConnectionState } from "@/lib/types";

interface DetailHeaderProps {
  serverName: string;
  serverId?: string;
  connectionState: ServerConnectionState;
  sessionUptime?: number;
}

export function DetailHeader({
  serverName,
  serverId,
  connectionState,
  sessionUptime,
}: DetailHeaderProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md p-2 hover:bg-accent transition-colors"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="size-5" />
      </Link>

      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight truncate">
            {serverName}
          </h1>
          <StatusBadge state={connectionState} />
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {serverId && (
            <span className="font-mono text-xs truncate">{serverId}</span>
          )}
          {sessionUptime !== undefined && sessionUptime > 0 && (
            <span className="text-xs">
              Session uptime: {formatDuration(sessionUptime)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
