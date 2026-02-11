"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TagChips } from "@/components/tag-chips";
import { useTags } from "@/hooks/use-servers";
import type { ServerFilterState } from "@/hooks/use-server-filters";

interface FilterBarProps {
  filters: ServerFilterState;
  onSearchChange: (search: string) => void;
  onToggleTag: (tag: string) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function FilterBar({
  filters,
  onSearchChange,
  onToggleTag,
  onClear,
  hasActiveFilters,
}: FilterBarProps) {
  const { data: allTags = [] } = useTags();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search servers..."
          className="h-8 pl-8 text-xs"
        />
      </div>

      {allTags.length > 0 && (
        <TagChips
          tags={allTags}
          onClick={onToggleTag}
          activeTags={filters.tags}
        />
      )}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={onClear}
        >
          <X className="size-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
