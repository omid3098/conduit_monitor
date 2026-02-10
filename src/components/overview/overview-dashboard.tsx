"use client";

import { useState } from "react";
import { useServers } from "@/hooks/use-servers";
import { useServerStatus } from "@/hooks/use-server-status";
import { useAggregatedHistory } from "@/hooks/use-aggregated-history";
import { AggregateStats } from "@/components/overview/aggregate-stats";
import { CompactServerCard } from "@/components/overview/compact-server-card";
import { CombinedCountryPanel } from "@/components/overview/combined-country-panel";
import { TimeRangeSelector } from "@/components/server-detail/time-range-selector";
import { ConnectionsChartPanel } from "@/components/server-detail/connections-chart-panel";
import { NetworkChartPanel } from "@/components/server-detail/network-chart-panel";
import { SystemChartPanel } from "@/components/server-detail/system-chart-panel";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  ServerSafe,
  ServerStatusResult,
  ServerConnectionState,
} from "@/lib/types";
import type { TimeRange } from "@/hooks/use-server-history";

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
  const results = servers.map((s) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, connectionState } = useServerStatus(s.id);
    return { data, connectionState };
  });
  return <>{children(results)}</>;
}

export function OverviewDashboard() {
  const { data: servers, isLoading } = useServers();
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const aggregatedHistoryQuery = useAggregatedHistory(timeRange);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[320px] rounded-xl" />
          ))}
        </div>
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

  const history = aggregatedHistoryQuery.data?.history ?? [];

  return (
    <ServerStatusCollector servers={servers}>
      {(serversData) => (
        <div className="space-y-6">
          {/* 1. Aggregate stats */}
          <AggregateStats serversData={serversData} />

          {/* 2. Compact server cards grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {servers.map((server) => (
              <CompactServerCard key={server.id} server={server} />
            ))}
          </div>

          {/* 3. Combined metrics header + time range */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Combined Metrics
            </h2>
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          </div>

          {/* 4. Combined charts (2x2 grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ConnectionsChartPanel history={history} />
            <NetworkChartPanel history={history} />
            <SystemChartPanel history={history} />
            <CombinedCountryPanel serversData={serversData} />
          </div>
        </div>
      )}
    </ServerStatusCollector>
  );
}
