"use client";

import { useState } from "react";
import { useServers, useDeleteServer } from "@/hooks/use-servers";
import { Button } from "@/components/ui/button";
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
              <TableCell>{server.label || "—"}</TableCell>
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
