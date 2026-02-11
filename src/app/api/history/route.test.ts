const { mockAll, mockPrepare } = vi.hoisted(() => {
  const mockAll = vi.fn((): unknown[] => []);
  const mockPrepare = vi.fn(() => ({ all: mockAll, get: vi.fn(), run: vi.fn() }));
  return { mockAll, mockPrepare };
});

vi.mock("@/lib/db", () => ({ default: { prepare: mockPrepare } }));

import { GET } from "./route";
import { NextRequest } from "next/server";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
});

afterEach(() => vi.useRealTimers());

function makeRequest(range?: string) {
  const url = range
    ? `http://localhost/api/history?range=${range}`
    : "http://localhost/api/history";
  return new NextRequest(new URL(url));
}

function makePoint(serverId: string, timestamp: number, cpu: number, connections: number) {
  return {
    server_id: serverId,
    data_json: JSON.stringify({
      timestamp,
      system_cpu: cpu,
      system_memory_used: 1024,
      system_memory_total: 4096,
      system_net_in: 50,
      system_net_out: 100,
      total_connections: connections,
      unique_ips: connections / 2,
      container_count: 1,
      total_container_cpu: cpu / 2,
      total_container_memory: 256,
      clients_by_country: [{ country: "US", connections }],
    }),
  };
}

describe("GET /api/history", () => {
  it("returns empty history when no data", async () => {
    mockAll.mockReturnValueOnce([]);

    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.history).toEqual([]);
    expect(body.data_points).toBe(0);
  });

  it("returns correct range in response", async () => {
    mockAll.mockReturnValueOnce([]);

    const res = await GET(makeRequest("6h"));
    const body = await res.json();
    expect(body.range).toBe("6h");
  });

  it("aggregates single server single bucket", async () => {
    const now = Math.floor(Date.now() / 1000);
    // Both points fall in same 30s bucket for 1h range
    const bucketStart = Math.floor(now / 30) * 30;
    mockAll.mockReturnValueOnce([
      makePoint("s1", bucketStart, 40, 10),
      makePoint("s1", bucketStart + 15, 60, 20),
    ]);

    const res = await GET(makeRequest("1h"));
    const body = await res.json();

    expect(body.history).toHaveLength(1);
    // Two points from same server should be averaged
    expect(body.history[0].system_cpu).toBeCloseTo(50, 0); // (40+60)/2
    expect(body.history[0].total_connections).toBeCloseTo(15, 0); // (10+20)/2
  });

  it("sums additive metrics across servers, averages CPU", async () => {
    const now = Math.floor(Date.now() / 1000);
    const bucketStart = Math.floor(now / 30) * 30;
    mockAll.mockReturnValueOnce([
      makePoint("s1", bucketStart, 40, 10),
      makePoint("s2", bucketStart, 60, 20),
    ]);

    const res = await GET(makeRequest("1h"));
    const body = await res.json();

    expect(body.history).toHaveLength(1);
    // CPU should be averaged: (40+60)/2 = 50
    expect(body.history[0].system_cpu).toBeCloseTo(50, 0);
    // Connections should be summed: 10+20 = 30
    expect(body.history[0].total_connections).toBe(30);
    // Memory should be summed
    expect(body.history[0].system_memory_used).toBe(2048); // 1024+1024
  });

  it("uses 30s buckets for 1h range", async () => {
    const now = Math.floor(Date.now() / 1000);
    const b1 = Math.floor(now / 30) * 30;
    const b2 = b1 + 30;
    mockAll.mockReturnValueOnce([
      makePoint("s1", b1, 50, 10),
      makePoint("s1", b2, 60, 20),
    ]);

    const res = await GET(makeRequest("1h"));
    const body = await res.json();
    expect(body.history).toHaveLength(2);
  });

  it("uses 300s buckets for 30d range", async () => {
    const now = Math.floor(Date.now() / 1000);
    // Two points 200s apart should be in same 300s bucket
    const b = Math.floor(now / 300) * 300;
    mockAll.mockReturnValueOnce([
      makePoint("s1", b, 50, 10),
      makePoint("s1", b + 200, 70, 20),
    ]);

    const res = await GET(makeRequest("30d"));
    const body = await res.json();
    expect(body.history).toHaveLength(1); // Same bucket
    expect(body.history[0].system_cpu).toBeCloseTo(60, 0); // (50+70)/2
  });

  it("merges country data across servers", async () => {
    const now = Math.floor(Date.now() / 1000);
    const bucketStart = Math.floor(now / 30) * 30;
    mockAll.mockReturnValueOnce([
      makePoint("s1", bucketStart, 50, 10),
      makePoint("s2", bucketStart, 50, 20),
    ]);

    const res = await GET(makeRequest("1h"));
    const body = await res.json();

    // Country "US" connections: 10 + 20 = 30
    const usCountry = body.history[0].clients_by_country.find(
      (c: { country: string }) => c.country === "US"
    );
    expect(usCountry.connections).toBe(30);
  });

  it("uses 900s buckets for 'all' range", async () => {
    const now = Math.floor(Date.now() / 1000);
    const b = Math.floor(now / 900) * 900;
    mockAll.mockReturnValueOnce([
      makePoint("s1", b, 50, 10),
      makePoint("s1", b + 500, 70, 20),
    ]);

    const res = await GET(makeRequest("all"));
    const body = await res.json();
    expect(body.history).toHaveLength(1); // Same 900s bucket
    expect(body.range).toBe("all");
  });

  it("defaults to 1h when invalid range is provided", async () => {
    mockAll.mockReturnValueOnce([]);

    const res = await GET(makeRequest("invalid"));
    const body = await res.json();
    expect(body.range).toBe("invalid");
    // Should use 1h bucket size (30s) as fallback
    expect(body.history).toEqual([]);
  });

  it("downsamples when data exceeds maxPoints", async () => {
    const now = Math.floor(Date.now() / 1000);
    // Generate 400 distinct buckets (exceeding HISTORY_MAX_POINTS=300)
    const points = [];
    for (let i = 0; i < 400; i++) {
      const ts = Math.floor(now / 30) * 30 + i * 30;
      points.push(makePoint("s1", ts, 50, 10));
    }
    mockAll.mockReturnValueOnce(points);

    const res = await GET(makeRequest("1h"));
    const body = await res.json();
    // Should be downsampled to around 300-301 points
    expect(body.history.length).toBeLessThanOrEqual(301);
    expect(body.history.length).toBeGreaterThan(200);
  });
});
