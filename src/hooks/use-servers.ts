"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ServerSafe } from "@/lib/types";

export function useServers() {
  return useQuery<ServerSafe[]>({
    queryKey: ["servers"],
    queryFn: async () => {
      const res = await fetch("/api/servers");
      if (!res.ok) throw new Error("Failed to fetch servers");
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useTags() {
  return useQuery<string[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json();
    },
    staleTime: 30_000,
  });
}

export function useAddServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { uri: string; label?: string; tags?: string[] }) => {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add server");
      }
      return res.json() as Promise<ServerSafe>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useRenameServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      const res = await fetch(`/api/servers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      if (!res.ok) throw new Error("Failed to rename server");
      return res.json() as Promise<ServerSafe>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
    },
  });
}

export function useUpdateServerTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const res = await fetch(`/api/servers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) throw new Error("Failed to update tags");
      return res.json() as Promise<ServerSafe>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useDeleteServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/servers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete server");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servers"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
