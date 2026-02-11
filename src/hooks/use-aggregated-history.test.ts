// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { useAggregatedHistory } from "./use-aggregated-history";
import { createWrapper } from "@/test/helpers";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useAggregatedHistory", () => {
  it("fetches aggregated history with default range", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ range: "1h", data_points: 0, history: [] }), { status: 200 })
    );

    const { result } = renderHook(() => useAggregatedHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith("/api/history?range=1h");
  });

  it("uses custom range", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ range: "24h", data_points: 0, history: [] }), { status: 200 })
    );

    const { result } = renderHook(() => useAggregatedHistory("24h"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith("/api/history?range=24h");
  });

  it("throws on error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Error", { status: 500 })
    );

    const { result } = renderHook(() => useAggregatedHistory(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
