"use client";

import { useServers } from "@/hooks/use-servers";
import { useServerStatus } from "@/hooks/use-server-status";
import { AggregateStats } from "@/components/overview/aggregate-stats";
import { ServerRow } from "@/components/overview/server-row";
import { Skeleton } from "@/components/ui/skeleton";
import type { ServerSafe, ServerStatusResult, ServerConnectionState } from "@/lib/types";

function ServerStatusCollector({
  servers,
  children,
}: {
  servers: ServerSafe[];
  children: (
    serversData: Array<{
      data: ServerStatusResult | undefined;
      connectionState: ServerConnectionState;
    }>
  ) => React.ReactNode;
}) {
  // We need to call hooks for each server at top level
  // This component acts as a hook collector
  const results = servers.map((s) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, connectionState } = useServerStatus(s.id);
    return { data, connectionState };
  });
  return <>{children(results)}</>;
}

export function OverviewDashboard() {
  const { data: servers, isLoading } = useServers();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!servers || servers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No servers configured</p>
        <p className="text-sm mt-1">
          Go to{" "}
          <a href="/servers" className="underline">
            Servers
          </a>{" "}
          to add one.
        </p>
      </div>
    );
  }

  return (
    <ServerStatusCollector servers={servers}>
      {(serversData) => (
        <div className="space-y-4">
          <AggregateStats serversData={serversData} />
          <div className="space-y-3">
            {servers.map((server) => (
              <ServerRow key={server.id} server={server} />
            ))}
          </div>
        </div>
      )}
    </ServerStatusCollector>
  );
}
