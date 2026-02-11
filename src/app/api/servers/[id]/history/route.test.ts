const { mockGet, mockPrepare, mockGetHistory } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockPrepare = vi.fn(() => ({ get: mockGet, all: vi.fn(), run: vi.fn() }));
  return { mockGet, mockPrepare, mockGetHistory: vi.fn() };
});

vi.mock("@/lib/db", () => ({ default: { prepare: mockPrepare } }));
vi.mock("@/lib/metrics-store", () => ({ getHistory: mockGetHistory }));

import { GET } from "./route";
import { NextRequest } from "next/server";

beforeEach(() => vi.clearAllMocks());

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/servers/[id]/history", () => {
  it("returns 404 when server not found", async () => {
    mockGet.mockReturnValueOnce(undefined);
    const res = await GET(
      new NextRequest(new URL("http://localhost/api/servers/bad/history")),
      params("bad")
    );
    expect(res.status).toBe(404);
  });

  it("uses default range 1h", async () => {
    mockGet.mockReturnValueOnce({ id: "s1" });
    mockGetHistory.mockReturnValueOnce([]);

    const res = await GET(
      new NextRequest(new URL("http://localhost/api/servers/s1/history")),
      params("s1")
    );
    const body = await res.json();
    expect(body.range).toBe("1h");
    expect(mockGetHistory).toHaveBeenCalledWith("s1", 3600);
  });

  it("parses range parameter 6h", async () => {
    mockGet.mockReturnValueOnce({ id: "s1" });
    mockGetHistory.mockReturnValueOnce([]);

    const res = await GET(
      new NextRequest(new URL("http://localhost/api/servers/s1/history?range=6h")),
      params("s1")
    );
    expect(mockGetHistory).toHaveBeenCalledWith("s1", 21600);
  });

  it("handles range=all with 0 seconds", async () => {
    mockGet.mockReturnValueOnce({ id: "s1" });
    mockGetHistory.mockReturnValueOnce([]);

    await GET(
      new NextRequest(new URL("http://localhost/api/servers/s1/history?range=all")),
      params("s1")
    );
    expect(mockGetHistory).toHaveBeenCalledWith("s1", 0);
  });

  it("falls back to 1h for unknown range", async () => {
    mockGet.mockReturnValueOnce({ id: "s1" });
    mockGetHistory.mockReturnValueOnce([]);

    await GET(
      new NextRequest(new URL("http://localhost/api/servers/s1/history?range=invalid")),
      params("s1")
    );
    expect(mockGetHistory).toHaveBeenCalledWith("s1", 3600);
  });

  it("returns correct response shape", async () => {
    const mockData = [{ timestamp: 1000 }];
    mockGet.mockReturnValueOnce({ id: "s1" });
    mockGetHistory.mockReturnValueOnce(mockData);

    const res = await GET(
      new NextRequest(new URL("http://localhost/api/servers/s1/history?range=24h")),
      params("s1")
    );
    const body = await res.json();
    expect(body.server_id).toBe("s1");
    expect(body.data_points).toBe(1);
    expect(body.history).toEqual(mockData);
  });
});
