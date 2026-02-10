"use client";

import { Button } from "@/components/ui/button";
import type { TimeRange } from "@/hooks/use-server-history";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  compact?: boolean;
}

const ranges: TimeRange[] = ["1h", "6h", "24h", "30d", "all"];

const rangeLabels: Record<TimeRange, string> = {
  "1h": "1h",
  "6h": "6h",
  "24h": "24h",
  "30d": "30d",
  "all": "All",
};

export function TimeRangeSelector({ value, onChange, compact }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-0.5">
      {ranges.map((range) => (
        <Button
          key={range}
          variant={value === range ? "default" : "outline"}
          size="sm"
          className={compact ? "h-6 px-2 text-xs" : undefined}
          onClick={() => onChange(range)}
        >
          {rangeLabels[range]}
        </Button>
      ))}
    </div>
  );
}
