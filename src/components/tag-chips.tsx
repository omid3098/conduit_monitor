"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Generate a consistent color from a string hash
function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 50%, 45%)`;
}

interface TagChipsProps {
  tags: string[];
  onRemove?: (tag: string) => void;
  onClick?: (tag: string) => void;
  activeTags?: string[];
}

export function TagChips({ tags, onRemove, onClick, activeTags }: TagChipsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => {
        const isActive = activeTags?.includes(tag);
        return (
          <Badge
            key={tag}
            variant="outline"
            className="text-[10px] px-1.5 py-0 h-5 gap-1 cursor-pointer transition-colors"
            style={{
              borderColor: tagColor(tag),
              color: tagColor(tag),
              backgroundColor: isActive
                ? `${tagColor(tag)}15`
                : undefined,
            }}
            onClick={() => onClick?.(tag)}
          >
            {tag}
            {onRemove && (
              <X
                className="size-2.5 cursor-pointer hover:opacity-70"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(tag);
                }}
              />
            )}
          </Badge>
        );
      })}
    </div>
  );
}
