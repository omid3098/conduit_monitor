"use client";

import Link from "next/link";
import { useServerStatus } from "@/hooks/use-server-status";
import type { ServerSafe, ServerConnectionState } from "@/lib/types";

const statusDotColors: Record<ServerConnectionState, string> = {
  online: "bg-emerald-500",
  offline: "bg-red-500",
  auth_failed: "bg-red-500",
  starting_up: "bg-yellow-500",
  stale: "bg-yellow-500",
  never_connected: "bg-gray-400",
};

function ServerPill({ server }: { server: ServerSafe }) {
  const { connectionState } = useServerStatus(server.id);
  const displayName =
    server.label || server.server_id || server.id.slice(0, 8);

  const isDown =
    connectionState === "offline" ||
    connectionState === "auth_failed" ||
    connectionState === "never_connected";

  return (
    <Link href={`/servers/${server.id}`}>
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium hover:bg-accent/10 transition-colors max-w-[140px] ${
          isDown ? "opacity-50" : ""
        }`}
      >
        <span
          className={`size-2 rounded-full shrink-0 ${statusDotColors[connectionState]}`}
        />
        <span className="truncate">{displayName}</span>
      </span>
    </Link>
  );
}

export function ServerPillBar({ servers }: { servers: ServerSafe[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {servers.map((server) => (
        <ServerPill key={server.id} server={server} />
      ))}
    </div>
  );
}
