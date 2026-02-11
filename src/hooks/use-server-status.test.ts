// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { useServerStatus } from "./use-server-status";
import { createWrapper } from "@/test/helpers";
import { makeAgentStatus } from "@/test/fixtures";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useServerStatus", () => {
  it("returns online state on successful fetch", async () => {
    const data = { ...makeAgentStatus(), stale: false };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(data), { status: 200 })
    );

    const { result } = renderHook(() => useServerStatus("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.connectionState).toBe("online");
    expect(result.current.data).toBeDefined();
  });

  it("returns stale state when data is stale", async () => {
    const data = { ...makeAgentStatus(), stale: true };
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(data), { status: 200 })
    );

    const { result } = renderHook(() => useServerStatus("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.connectionState).toBe("stale");
  });

  it("returns auth_failed on 401", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "auth_failed", last_seen_at: "2025-01-01" }), { status: 401 })
    );

    const { result } = renderHook(() => useServerStatus("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.connectionState).toBe("auth_failed"));
    expect(result.current.lastSeenAt).toBe("2025-01-01");
  });

  it("returns starting_up on 503", async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ error: "starting_up" }), { status: 503 }))
    );

    const { result } = renderHook(() => useServerStatus("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.connectionState).toBe("starting_up"), { timeout: 5000 });
  });

  it("returns offline on other errors", async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ error: "offline", last_seen_at: "2025-01-01", first_seen_at: "2025-01-01" }), { status: 502 }))
    );

    const { result } = renderHook(() => useServerStatus("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.connectionState).toBe("offline"), { timeout: 5000 });
  });

  it("returns never_connected when offline with no firstSeenAt", async () => {
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve(new Response(JSON.stringify({ error: "offline", last_seen_at: null, first_seen_at: null }), { status: 502 }))
    );

    const { result } = renderHook(() => useServerStatus("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.connectionState).toBe("never_connected"), { timeout: 5000 });
  });

  it("returns offline on network error", async () => {
    vi.mocked(fetch).mockImplementation(() => Promise.reject(new Error("Network error")));

    const { result } = renderHook(() => useServerStatus("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.connectionState).toBe("offline"), { timeout: 5000 });
  });
});
