const { mockGet, mockPrepare, mockComputeUptime } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockPrepare = vi.fn(() => ({ get: mockGet, all: vi.fn(), run: vi.fn() }));
  return { mockGet, mockPrepare, mockComputeUptime: vi.fn() };
});

vi.mock("@/lib/db", () => ({ default: { prepare: mockPrepare } }));
vi.mock("@/lib/uptime-store", () => ({ computeUptime: mockComputeUptime }));

import { GET } from "./route";
import { NextRequest } from "next/server";

beforeEach(() => vi.clearAllMocks());

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/servers/[id]/uptime", () => {
  it("returns 404 when server not found", async () => {
    mockGet.mockReturnValueOnce(undefined);
    const res = await GET(
      new NextRequest(new URL("http://localhost/api/servers/bad/uptime")),
      params("bad")
    );
    expect(res.status).toBe(404);
  });

  it("uses default range 24h", async () => {
    mockGet.mockReturnValueOnce({ id: "s1" });
    mockComputeUptime.mockReturnValueOnce({ uptimePercent: 99.5, downtimeIncidents: [] });

    const res = await GET(
      new NextRequest(new URL("http://localhost/api/servers/s1/uptime")),
      params("s1")
    );
    const body = await res.json();
    expect(body.range).toBe("24h");
    expect(body.uptime_percent).toBe(99.5);
    expect(mockComputeUptime).toHaveBeenCalledWith("s1", 86400);
  });

  it("parses range parameter 7d", async () => {
    mockGet.mockReturnValueOnce({ id: "s1" });
    mockComputeUptime.mockReturnValueOnce({ uptimePercent: 98, downtimeIncidents: [] });

    await GET(
      new NextRequest(new URL("http://localhost/api/servers/s1/uptime?range=7d")),
      params("s1")
    );
    expect(mockComputeUptime).toHaveBeenCalledWith("s1", 604800);
  });

  it("falls back to 24h for unknown range", async () => {
    mockGet.mockReturnValueOnce({ id: "s1" });
    mockComputeUptime.mockReturnValueOnce({ uptimePercent: 100, downtimeIncidents: [] });

    await GET(
      new NextRequest(new URL("http://localhost/api/servers/s1/uptime?range=invalid")),
      params("s1")
    );
    expect(mockComputeUptime).toHaveBeenCalledWith("s1", 86400);
  });
});
