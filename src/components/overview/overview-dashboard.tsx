"use client";

import { useState } from "react";
import { useServers } from "@/hooks/use-servers";
import { useServerStatus } from "@/hooks/use-server-status";
import { useAggregatedHistory } from "@/hooks/use-aggregated-history";
import { AggregateStats } from "@/components/overview/aggregate-stats";
import { ServerPillBar } from "@/components/overview/server-pill-bar";
import { CombinedCountryPanel } from "@/components/overview/combined-country-panel";
import { WorldMapPanel } from "@/components/world-map/world-map-panel";
import type { AgentCountryClients, AgentCountryTraffic } from "@/lib/types";
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
      <div className="flex flex-col gap-1.5" style={{ height: "calc(100vh - 6rem)" }}>
        <div className="flex items-center gap-2 shrink-0">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-7 w-24 rounded-full" />
          ))}
          <div className="flex-1" />
          <Skeleton className="h-6 w-40 rounded-md" />
        </div>
        <Skeleton className="h-11 rounded-lg shrink-0" />
        <div className="shrink-0 max-h-[35vh] flex gap-1.5">
          <Skeleton className="flex-1 min-w-0 rounded-lg h-[30vh]" />
          <Skeleton className="w-[30%] min-w-[200px] max-w-[320px] rounded-lg h-[30vh]" />
        </div>
        <div className="flex-1 min-h-0 grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!servers || servers.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height: "calc(100vh - 6rem)" }}
      >
        <div className="text-center">
          <p className="text-lg">No servers configured</p>
          <p className="text-sm mt-1">
            Go to{" "}
            <a href="/servers" className="underline">
              Servers
            </a>{" "}
            to add one.
          </p>
        </div>
      </div>
    );
  }

  const history = aggregatedHistoryQuery.data?.history ?? [];

  return (
    <ServerStatusCollector servers={servers}>
      {(serversData) => (
        <div className="flex flex-col gap-1.5" style={{ height: "calc(100vh - 6rem)" }}>
          {/* Row 1: Server pills + Time range selector */}
          <div className="flex items-center justify-between shrink-0 gap-4">
            <ServerPillBar servers={servers} />
            <TimeRangeSelector value={timeRange} onChange={setTimeRange} compact />
          </div>

          {/* Row 2: Aggregate stats strip */}
          <div className="shrink-0">
            <AggregateStats serversData={serversData} />
          </div>

          {/* Row 3: World map (left) + Country list sidebar (right) */}
          <div className="shrink-0 max-h-[35vh] flex gap-1.5">
            <div className="flex-1 min-w-0 overflow-hidden">
              <WorldMapPanel
                countries={
                  serversData.reduce<AgentCountryClients[]>((acc, s) => {
                    if (!s.data?.clients_by_country) return acc;
                    for (const c of s.data.clients_by_country) {
                      const existing = acc.find((x) => x.country === c.country);
                      if (existing) existing.connections += c.connections;
                      else acc.push({ ...c });
                    }
                    return acc;
                  }, [])
                }
                traffic={
                  serversData.reduce<AgentCountryTraffic[]>((acc, s) => {
                    if (!s.data?.traffic_by_country) return acc;
                    for (const t of s.data.traffic_by_country) {
                      const existing = acc.find((x) => x.country === t.country);
                      if (existing) {
                        existing.from_bytes += t.from_bytes;
                        existing.to_bytes += t.to_bytes;
                      } else {
                        acc.push({ ...t });
                      }
                    }
                    return acc;
                  }, [])
                }
              />
            </div>
            <div className="w-[30%] min-w-[200px] max-w-[320px]">
              <CombinedCountryPanel serversData={serversData} variant="list" />
            </div>
          </div>

          {/* Row 4: 3 time-series charts in a single row */}
          <div className="flex-1 min-h-0 grid grid-cols-3 gap-1.5">
            <ConnectionsChartPanel history={history} compact />
            <NetworkChartPanel history={history} compact />
            <SystemChartPanel history={history} compact />
          </div>
        </div>
      )}
    </ServerStatusCollector>
  );
}
