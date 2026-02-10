"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useServer } from "@/hooks/use-server-detail";
import { useServerStatus } from "@/hooks/use-server-status";
import { useServerHistory, type TimeRange } from "@/hooks/use-server-history";
import { DetailHeader } from "@/components/server-detail/detail-header";
import { TimeRangeSelector } from "@/components/server-detail/time-range-selector";
import { StatRow } from "@/components/server-detail/stat-row";
import { ConnectionsChartPanel } from "@/components/server-detail/connections-chart-panel";
import { NetworkChartPanel } from "@/components/server-detail/network-chart-panel";
import { SystemChartPanel } from "@/components/server-detail/system-chart-panel";
import { LoadAveragePanel } from "@/components/server-detail/load-average-panel";
import { CountryPanel } from "@/components/server-detail/country-panel";
import { TcpStatesPanel } from "@/components/server-detail/tcp-states-panel";
import { SessionSettingsStrip } from "@/components/server-detail/session-settings-strip";
import { ContainerList } from "@/components/server-detail/container-list";

interface ServerDetailViewProps {
  serverId: string;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Time range skeleton */}
      <Skeleton className="h-8 w-40" />

      {/* Stat panels skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-lg" />
        ))}
      </div>

      {/* Session strip skeleton */}
      <Skeleton className="h-[60px] rounded-xl" />

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[320px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg font-medium text-destructive">{message}</p>
      <p className="text-sm text-muted-foreground mt-2">
        Please check that the server exists and try again.
      </p>
    </div>
  );
}

export function ServerDetailView({ serverId }: ServerDetailViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");

  const serverQuery = useServer(serverId);
  const { data: statusData, connectionState, isLoading: statusLoading } =
    useServerStatus(serverId);
  const historyQuery = useServerHistory(serverId, timeRange);

  // Loading state
  if (serverQuery.isLoading || statusLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (serverQuery.error) {
    return <ErrorState message="Server not found" />;
  }

  const server = serverQuery.data;
  if (!server) {
    return <ErrorState message="Server not found" />;
  }

  const displayName = server.label || server.server_id || server.id.slice(0, 8);
  const history = historyQuery.data?.history ?? [];

  // Compute session uptime
  const sessionUptime = statusData?.session
    ? (Date.now() / 1000) - statusData.session.start_time
    : undefined;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <DetailHeader
          serverName={displayName}
          serverId={server.server_id ?? undefined}
          connectionState={connectionState}
          sessionUptime={sessionUptime}
        />
        {/* 2. Time range selector */}
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* 3. Stat row */}
      {statusData && (
        <StatRow data={statusData} sparklineData={history} />
      )}

      {/* 4. Session & settings strip */}
      <SessionSettingsStrip
        session={statusData?.session ?? null}
        settings={statusData?.settings ?? null}
      />

      {/* 5. 2x2 chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConnectionsChartPanel history={history} />
        <NetworkChartPanel history={history} />
        <SystemChartPanel history={history} />
        <LoadAveragePanel
          system={statusData?.system ?? null}
          history={history}
        />
      </div>

      {/* 6. Country + TCP states */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CountryPanel countries={statusData?.clients_by_country ?? []} />
        <TcpStatesPanel connections={statusData?.connections ?? null} />
      </div>

      {/* 7. Container list */}
      <ContainerList containers={statusData?.containers ?? []} />
    </div>
  );
}
