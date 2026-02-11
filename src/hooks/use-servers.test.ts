// @vitest-environment jsdom
import { renderHook, waitFor, act } from "@testing-library/react";
import { useServers, useTags, useAddServer, useRenameServer, useUpdateServerTags, useDeleteServer } from "./use-servers";
import { createWrapper } from "@/test/helpers";
import { makeServerSafe } from "@/test/fixtures";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useServers", () => {
  it("fetches servers successfully", async () => {
    const servers = [makeServerSafe()];
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(servers), { status: 200 })
    );

    const { result } = renderHook(() => useServers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it("throws on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Error", { status: 500 })
    );

    const { result } = renderHook(() => useServers(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useTags", () => {
  it("fetches tags successfully", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(["prod", "staging"]), { status: 200 })
    );

    const { result } = renderHook(() => useTags(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(["prod", "staging"]);
  });
});

describe("useAddServer", () => {
  it("calls POST /api/servers", async () => {
    const newServer = makeServerSafe();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(newServer), { status: 201 })
    );

    const { result } = renderHook(() => useAddServer(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ uri: "conduit://secret@host:8080", label: "Test" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith("/api/servers", expect.objectContaining({
      method: "POST",
    }));
  });

  it("throws with error message on failure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Duplicate" }), { status: 409 })
    );

    const { result } = renderHook(() => useAddServer(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ uri: "conduit://secret@host:8080" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Duplicate");
  });
});

describe("useRenameServer", () => {
  it("calls PATCH /api/servers/:id with label", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makeServerSafe({ label: "New Name" })), { status: 200 })
    );

    const { result } = renderHook(() => useRenameServer(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: "s1", label: "New Name" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith("/api/servers/s1", expect.objectContaining({
      method: "PATCH",
    }));
  });

  it("throws on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Error", { status: 500 })
    );

    const { result } = renderHook(() => useRenameServer(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: "s1", label: "New" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useUpdateServerTags", () => {
  it("calls PATCH /api/servers/:id with tags", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makeServerSafe({ tags: ["prod", "us"] })), { status: 200 })
    );

    const { result } = renderHook(() => useUpdateServerTags(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: "s1", tags: ["prod", "us"] });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith("/api/servers/s1", expect.objectContaining({
      method: "PATCH",
    }));
  });

  it("throws on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Error", { status: 500 })
    );

    const { result } = renderHook(() => useUpdateServerTags(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate({ id: "s1", tags: ["prod"] });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useDeleteServer", () => {
  it("calls DELETE /api/servers/:id", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200 })
    );

    const { result } = renderHook(() => useDeleteServer(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate("test-id");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith("/api/servers/test-id", { method: "DELETE" });
  });

  it("throws on non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Error", { status: 500 })
    );

    const { result } = renderHook(() => useDeleteServer(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate("s1");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
