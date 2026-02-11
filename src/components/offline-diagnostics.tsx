"use client";

import { AlertTriangle, WifiOff, ShieldAlert, HelpCircle } from "lucide-react";
import { formatRelativeTime, formatDuration } from "@/lib/format";
import type { ServerConnectionState } from "@/lib/types";

interface OfflineDiagnosticsProps {
  connectionState: ServerConnectionState;
  lastSeenAt?: string | null;
}

export function OfflineDiagnostics({
  connectionState,
  lastSeenAt,
}: OfflineDiagnosticsProps) {
  if (connectionState === "online" || connectionState === "stale") return null;

  const offlineDurationSec = lastSeenAt
    ? Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 1000)
    : null;

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 space-y-4">
      <div className="flex items-start gap-3">
        {connectionState === "auth_failed" ? (
          <ShieldAlert className="size-5 text-destructive shrink-0 mt-0.5" />
        ) : connectionState === "never_connected" ? (
          <HelpCircle className="size-5 text-muted-foreground shrink-0 mt-0.5" />
        ) : (
          <WifiOff className="size-5 text-destructive shrink-0 mt-0.5" />
        )}

        <div className="space-y-1 min-w-0">
          <h3 className="font-semibold text-sm">
            {connectionState === "auth_failed"
              ? "Authentication Failed"
              : connectionState === "never_connected"
                ? "Never Connected"
                : connectionState === "starting_up"
                  ? "Agent Starting Up"
                  : "Server Offline"}
          </h3>

          {lastSeenAt && (
            <p className="text-sm text-muted-foreground">
              Last seen: {formatRelativeTime(lastSeenAt)}
              {offlineDurationSec !== null && offlineDurationSec >= 60 && (
                <> (offline for {formatDuration(offlineDurationSec)})</>
              )}
            </p>
          )}

          {connectionState === "never_connected" && (
            <p className="text-sm text-muted-foreground">
              This server has never successfully connected. Verify the connection URI is correct.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2 text-xs text-muted-foreground">
        <p className="font-medium text-foreground/80">Possible causes:</p>
        <ul className="list-disc list-inside space-y-1 ml-1">
          {connectionState === "auth_failed" ? (
            <>
              <li>The authentication secret in the connection URI doesn&apos;t match the agent</li>
              <li>The agent was reinstalled with a new secret</li>
            </>
          ) : connectionState === "starting_up" ? (
            <>
              <li>The agent just started and is collecting initial metrics</li>
              <li>This usually resolves within 15-30 seconds</li>
            </>
          ) : (
            <>
              <li>The conduit-expose agent process may not be running</li>
              <li>Network connectivity or firewall issue</li>
              <li>The agent&apos;s port may have changed</li>
              <li>The server may be down or rebooting</li>
            </>
          )}
        </ul>

        {connectionState !== "starting_up" && (
          <>
            <p className="font-medium text-foreground/80 pt-2">Diagnostic steps:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Check that the agent is running on the server</li>
              <li>Verify the connection URI matches the agent&apos;s configuration</li>
              <li>Test the health endpoint: <code className="bg-muted px-1 py-0.5 rounded text-[11px]">curl http://&lt;host&gt;:&lt;port&gt;/health</code></li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
