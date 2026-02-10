"use client";

import { ContainerDetailCard } from "@/components/server-detail/container-detail-card";
import type { AgentContainer } from "@/lib/types";

interface ContainerListProps {
  containers: AgentContainer[];
}

export function ContainerList({ containers }: ContainerListProps) {
  if (containers.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Containers ({containers.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {containers.map((container) => (
          <ContainerDetailCard key={container.id} container={container} />
        ))}
      </div>
    </div>
  );
}
