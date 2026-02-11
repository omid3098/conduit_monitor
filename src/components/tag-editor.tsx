"use client";

import { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TagChips } from "@/components/tag-chips";
import { useTags } from "@/hooks/use-servers";

interface TagEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagEditor({ tags, onChange }: TagEditorProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: allTags = [] } = useTags();

  const suggestions = allTags.filter(
    (t) => !tags.includes(t) && t.includes(input.toLowerCase())
  );

  const addTag = (tag: string) => {
    const clean = tag.trim().toLowerCase();
    if (clean && !tags.includes(clean)) {
      onChange([...tags, clean]);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-1.5">
      <TagChips tags={tags} onRemove={removeTag} />
      <div className="relative">
        <div className="flex items-center gap-1">
          <Plus className="size-3 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Add tag..."
            className="h-7 text-xs"
          />
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md z-50 max-h-32 overflow-y-auto">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(tag);
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
