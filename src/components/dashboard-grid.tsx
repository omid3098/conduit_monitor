"use client";

import { useServers } from "@/hooks/use-servers";
import { ServerCard } from "@/components/server-card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardGrid() {
  const { data: servers, isLoading } = useServers();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!servers?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No servers configured yet.</p>
        <p className="text-sm mt-1">
          Go to the Servers page to add one.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {servers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </div>
  );
}
