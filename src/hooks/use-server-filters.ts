"use client";

import { useState, useMemo, useCallback } from "react";
import type { ServerSafe, ServerConnectionState } from "@/lib/types";

export type ServerSortField = "label" | "created_at";
export type SortDirection = "asc" | "desc";

export interface ServerFilterState {
  search: string;
  tags: string[];
  sort: ServerSortField;
  sortDir: SortDirection;
}

const DEFAULT_FILTERS: ServerFilterState = {
  search: "",
  tags: [],
  sort: "label",
  sortDir: "asc",
};

export function useServerFilters() {
  const [filters, setFilters] = useState<ServerFilterState>(DEFAULT_FILTERS);

  const setSearch = useCallback(
    (search: string) => setFilters((f) => ({ ...f, search })),
    []
  );

  const toggleTag = useCallback(
    (tag: string) =>
      setFilters((f) => ({
        ...f,
        tags: f.tags.includes(tag)
          ? f.tags.filter((t) => t !== tag)
          : [...f.tags, tag],
      })),
    []
  );

  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const filterServers = useMemo(() => {
    return (servers: ServerSafe[]) => {
      let result = servers;

      // Search filter
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(
          (s) =>
            (s.label ?? "").toLowerCase().includes(q) ||
            (s.server_id ?? "").toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q) ||
            s.tags.some((t) => t.includes(q))
        );
      }

      // Tag filter
      if (filters.tags.length > 0) {
        result = result.filter((s) =>
          filters.tags.some((t) => s.tags.includes(t))
        );
      }

      // Sort
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (filters.sort === "label") {
          const aName = (a.label ?? a.server_id ?? a.id).toLowerCase();
          const bName = (b.label ?? b.server_id ?? b.id).toLowerCase();
          cmp = aName.localeCompare(bName);
        } else if (filters.sort === "created_at") {
          cmp = a.created_at.localeCompare(b.created_at);
        }
        return filters.sortDir === "desc" ? -cmp : cmp;
      });

      return result;
    };
  }, [filters]);

  const hasActiveFilters = filters.search !== "" || filters.tags.length > 0;

  return {
    filters,
    setSearch,
    toggleTag,
    clearFilters,
    filterServers,
    hasActiveFilters,
  };
}
