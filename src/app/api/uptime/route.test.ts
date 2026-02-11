const { mockAll, mockPrepare, mockComputeUptime } = vi.hoisted(() => {
  const mockAll = vi.fn((): unknown[] => []);
  const mockPrepare = vi.fn(() => ({ all: mockAll, get: vi.fn(), run: vi.fn() }));
  return { mockAll, mockPrepare, mockComputeUptime: vi.fn() };
});

vi.mock("@/lib/db", () => ({ default: { prepare: mockPrepare } }));
vi.mock("@/lib/uptime-store", () => ({ computeUptime: mockComputeUptime }));

import { GET } from "./route";
import { NextRequest } from "next/server";

beforeEach(() => vi.clearAllMocks());

function makeRequest(range?: string) {
  const url = range
    ? `http://localhost/api/uptime?range=${range}`
    : "http://localhost/api/uptime";
  return new NextRequest(new URL(url));
}

describe("GET /api/uptime", () => {
  it("returns 100% fleet uptime when no servers", async () => {
    mockAll.mockReturnValueOnce([]);
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.fleet_uptime_percent).toBe(100);
    expect(body.server_uptimes).toEqual([]);
  });

  it("averages uptime across servers", async () => {
    mockAll.mockReturnValueOnce([{ id: "s1" }, { id: "s2" }]);
    mockComputeUptime
      .mockReturnValueOnce({ uptimePercent: 100, downtimeIncidents: [] })
      .mockReturnValueOnce({ uptimePercent: 50, downtimeIncidents: [] });

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.fleet_uptime_percent).toBe(75);
    expect(body.server_uptimes).toHaveLength(2);
  });

  it("uses correct range parameter", async () => {
    mockAll.mockReturnValueOnce([{ id: "s1" }]);
    mockComputeUptime.mockReturnValueOnce({ uptimePercent: 99, downtimeIncidents: [] });

    const res = await GET(makeRequest("7d"));
    const body = await res.json();
    expect(body.range).toBe("7d");
    expect(mockComputeUptime).toHaveBeenCalledWith("s1", 604800);
  });
});
