// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { useServerHistory } from "./use-server-history";
import { createWrapper } from "@/test/helpers";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useServerHistory", () => {
  it("fetches history with default range", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ server_id: "s1", range: "1h", data_points: 0, history: [] }), { status: 200 })
    );

    const { result } = renderHook(() => useServerHistory("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith("/api/servers/s1/history?range=1h");
  });

  it("fetches history with custom range", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ server_id: "s1", range: "24h", data_points: 0, history: [] }), { status: 200 })
    );

    const { result } = renderHook(() => useServerHistory("s1", "24h"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith("/api/servers/s1/history?range=24h");
  });

  it("throws on error response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Error", { status: 500 })
    );

    const { result } = renderHook(() => useServerHistory("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
