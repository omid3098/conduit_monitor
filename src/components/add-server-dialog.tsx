"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddServer } from "@/hooks/use-servers";

export function AddServerDialog() {
  const [open, setOpen] = useState(false);
  const [uri, setUri] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const addServer = useAddServer();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!uri.startsWith("conduit://")) {
      setError("URI must start with conduit://");
      return;
    }

    try {
      await addServer.mutateAsync({ uri, label: label || undefined });
      setUri("");
      setLabel("");
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add server"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Server</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Conduit Server</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="uri">Conduit URI</Label>
            <Input
              id="uri"
              placeholder="conduit://SECRET@HOST:PORT"
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="label">Label (optional)</Label>
            <Input
              id="label"
              placeholder="e.g., US-East-1"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={addServer.isPending}>
            {addServer.isPending ? "Adding..." : "Add Server"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
