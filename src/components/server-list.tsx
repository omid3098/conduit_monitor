"use client";

import { useState, useRef, useEffect } from "react";
import { useServers, useDeleteServer, useRenameServer, useUpdateServerTags } from "@/hooks/use-servers";
import { useServerFilters } from "@/hooks/use-server-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FilterBar } from "@/components/filter-bar";
import { TagChips } from "@/components/tag-chips";
import { TagEditor } from "@/components/tag-editor";

function EditableLabel({
  serverId,
  currentLabel,
}: {
  serverId: string;
  currentLabel: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentLabel ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const renameServer = useRenameServer();

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const save = async () => {
    const trimmed = value.trim();
    if (trimmed !== (currentLabel ?? "")) {
      await renameServer.mutateAsync({ id: serverId, label: trimmed });
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") {
            setValue(currentLabel ?? "");
            setEditing(false);
          }
        }}
        className="h-7 w-48"
        disabled={renameServer.isPending}
      />
    );
  }

  return (
    <button
      onClick={() => {
        setValue(currentLabel ?? "");
        setEditing(true);
      }}
      className="text-left hover:underline cursor-pointer"
      title="Click to rename"
    >
      {currentLabel || "—"}
    </button>
  );
}

function InlineTagEditor({ serverId, tags }: { serverId: string; tags: string[] }) {
  const [editing, setEditing] = useState(false);
  const updateTags = useUpdateServerTags();

  if (editing) {
    return (
      <div className="min-w-[200px]">
        <TagEditor
          tags={tags}
          onChange={async (newTags) => {
            await updateTags.mutateAsync({ id: serverId, tags: newTags });
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-5 text-[10px] mt-1"
          onClick={() => setEditing(false)}
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-left cursor-pointer hover:opacity-75"
      title="Click to edit tags"
    >
      {tags.length > 0 ? (
        <TagChips tags={tags} />
      ) : (
        <span className="text-xs text-muted-foreground">+ Add tags</span>
      )}
    </button>
  );
}

export function ServerList() {
  const { data: servers, isLoading } = useServers();
  const deleteServer = useDeleteServer();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { filters, setSearch, toggleTag, clearFilters, filterServers, hasActiveFilters } =
    useServerFilters();

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  if (!servers?.length) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No servers added yet. Click &quot;Add Server&quot; to get started.
      </p>
    );
  }

  const filtered = filterServers(servers);

  return (
    <>
      <div className="space-y-3">
        <FilterBar
          filters={filters}
          onSearchChange={setSearch}
          onToggleTag={toggleTag}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Label</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Server ID</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((server) => (
              <TableRow key={server.id}>
                <TableCell>
                  <EditableLabel
                    serverId={server.id}
                    currentLabel={server.label}
                  />
                </TableCell>
                <TableCell>
                  <InlineTagEditor
                    serverId={server.id}
                    tags={server.tags}
                  />
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {server.server_id || "Unknown"}
                </TableCell>
                <TableCell>
                  {new Date(server.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmId(server.id)}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {hasActiveFilters && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No servers match your filters.
          </p>
        )}
      </div>

      <Dialog open={confirmId !== null} onOpenChange={() => setConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Server</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this server? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (confirmId) {
                  await deleteServer.mutateAsync(confirmId);
                  setConfirmId(null);
                }
              }}
              disabled={deleteServer.isPending}
            >
              {deleteServer.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
