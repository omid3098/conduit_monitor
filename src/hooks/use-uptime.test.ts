// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { useServerUptime, useFleetUptime } from "./use-uptime";
import { createWrapper } from "@/test/helpers";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useServerUptime", () => {
  it("fetches server uptime with default range", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({
        server_id: "s1", range: "24h", uptime_percent: 99.5, downtime_incidents: [],
      }), { status: 200 })
    );

    const { result } = renderHook(() => useServerUptime("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith("/api/servers/s1/uptime?range=24h");
    expect(result.current.data?.uptime_percent).toBe(99.5);
  });

  it("uses custom range", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({
        server_id: "s1", range: "7d", uptime_percent: 100, downtime_incidents: [],
      }), { status: 200 })
    );

    const { result } = renderHook(() => useServerUptime("s1", "7d"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith("/api/servers/s1/uptime?range=7d");
  });
});

describe("useFleetUptime", () => {
  it("fetches fleet uptime", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({
        range: "24h", fleet_uptime_percent: 99.0, server_uptimes: [],
      }), { status: 200 })
    );

    const { result } = renderHook(() => useFleetUptime(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith("/api/uptime?range=24h");
  });

  it("uses custom range", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({
        range: "30d", fleet_uptime_percent: 98.0, server_uptimes: [],
      }), { status: 200 })
    );

    const { result } = renderHook(() => useFleetUptime("30d"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledWith("/api/uptime?range=30d");
  });

  it("handles error response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Error", { status: 500 })
    );

    const { result } = renderHook(() => useFleetUptime(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useServerUptime error handling", () => {
  it("handles error response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Error", { status: 500 })
    );

    const { result } = renderHook(() => useServerUptime("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
