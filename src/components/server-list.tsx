"use client";

import { useState, useRef, useEffect } from "react";
import { useServers, useDeleteServer, useRenameServer } from "@/hooks/use-servers";
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

export function ServerList() {
  const { data: servers, isLoading } = useServers();
  const deleteServer = useDeleteServer();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  if (!servers?.length) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No servers added yet. Click &quot;Add Server&quot; to get started.
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Label</TableHead>
            <TableHead>Server ID</TableHead>
            <TableHead>Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {servers.map((server) => (
            <TableRow key={server.id}>
              <TableCell>
                <EditableLabel
                  serverId={server.id}
                  currentLabel={server.label}
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
