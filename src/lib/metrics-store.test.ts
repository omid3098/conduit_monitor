const { mockRun, mockAll, mockGet, mockPrepare } = vi.hoisted(() => {
  const mockRun = vi.fn((): { changes: number } => ({ changes: 1 }));
  const mockAll = vi.fn((): unknown[] => []);
  const mockGet = vi.fn();
  const mockPrepare = vi.fn(() => ({
    run: mockRun,
    all: mockAll,
    get: mockGet,
  }));
  return { mockRun, mockAll, mockGet, mockPrepare };
});

vi.mock("@/lib/db", () => ({
  default: { prepare: mockPrepare },
}));

import { storeSnapshot, getHistory, cleanup } from "./metrics-store";
import { makeAgentStatus } from "@/test/fixtures";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("storeSnapshot", () => {
  it("extracts correct fields from AgentStatusResponse", () => {
    const data = makeAgentStatus({
      timestamp: 1000,
      total_containers: 2,
      containers: [
        {
          id: "c1", name: "c1", status: "running",
          cpu_percent: 10, memory_mb: 128, uptime: "1h",
          health: null, app_metrics: null, settings: null,
        },
        {
          id: "c2", name: "c2", status: "running",
          cpu_percent: 20, memory_mb: 256, uptime: "2h",
          health: null, app_metrics: null, settings: null,
        },
      ],
      clients_by_country: [{ country: "US", connections: 8 }],
    });

    storeSnapshot("server-1", data);

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO metrics_history")
    );
    expect(mockRun).toHaveBeenCalledWith("server-1", 1000, expect.any(String));

    const storedJson = JSON.parse(mockRun.mock.calls[0][2] as string);
    expect(storedJson.total_container_cpu).toBe(30);
    expect(storedJson.total_container_memory).toBe(384);
    expect(storedJson.clients_by_country).toEqual([
      { country: "US", connections: 8 },
    ]);
  });

  it("defaults to 0 when system/connections are null", () => {
    const data = makeAgentStatus({
      timestamp: 1000,
      system: null,
      connections: null,
      containers: [],
      clients_by_country: [],
    });

    storeSnapshot("server-1", data);

    const storedJson = JSON.parse(mockRun.mock.calls[0][2] as string);
    expect(storedJson.system_cpu).toBe(0);
    expect(storedJson.system_memory_used).toBe(0);
    expect(storedJson.total_connections).toBe(0);
    expect(storedJson.unique_ips).toBe(0);
    expect(storedJson.total_container_cpu).toBe(0);
    expect(storedJson.total_container_memory).toBe(0);
  });
});

describe("getHistory", () => {
  it("queries with time filter when rangeSeconds > 0", () => {
    mockAll.mockReturnValueOnce([]);
    getHistory("server-1", 3600);

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining("timestamp >= ?")
    );
    const now = Math.floor(Date.now() / 1000);
    expect(mockAll).toHaveBeenCalledWith("server-1", now - 3600);
  });

  it("queries all data when rangeSeconds is 0", () => {
    mockAll.mockReturnValueOnce([]);
    getHistory("server-1", 0);

    const allCalls = mockPrepare.mock.calls;
    const lastCallSql = allCalls[allCalls.length - 1][0];
    expect(lastCallSql).not.toContain("timestamp >= ?");
    expect(mockAll).toHaveBeenCalledWith("server-1");
  });

  it("parses JSON from rows", () => {
    const point = {
      timestamp: 1000, system_cpu: 50, system_memory_used: 2048,
      system_memory_total: 8192, system_net_in: 100, system_net_out: 200,
      total_connections: 18, unique_ips: 12, container_count: 2,
      total_container_cpu: 20, total_container_memory: 384,
      clients_by_country: [],
    };
    mockAll.mockReturnValueOnce([{ data_json: JSON.stringify(point) }]);

    const result = getHistory("server-1", 3600);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(point);
  });

  it("downsamples when data exceeds max points", () => {
    const points = Array.from({ length: 600 }, (_, i) => ({
      data_json: JSON.stringify({
        timestamp: 1000 + i, system_cpu: i, system_memory_used: 0,
        system_memory_total: 0, system_net_in: 0, system_net_out: 0,
        total_connections: 0, unique_ips: 0, container_count: 0,
        total_container_cpu: 0, total_container_memory: 0,
        clients_by_country: [],
      }),
    }));
    mockAll.mockReturnValueOnce(points);

    const result = getHistory("server-1", 3600);
    expect(result.length).toBeLessThanOrEqual(302);
    expect(result.length).toBeGreaterThanOrEqual(300);
  });

  it("returns data as-is when within max points", () => {
    const points = Array.from({ length: 5 }, (_, i) => ({
      data_json: JSON.stringify({
        timestamp: 1000 + i, system_cpu: i, system_memory_used: 0,
        system_memory_total: 0, system_net_in: 0, system_net_out: 0,
        total_connections: 0, unique_ips: 0, container_count: 0,
        total_container_cpu: 0, total_container_memory: 0,
        clients_by_country: [],
      }),
    }));
    mockAll.mockReturnValueOnce(points);

    const result = getHistory("server-1", 3600);
    expect(result).toHaveLength(5);
  });
});

describe("cleanup", () => {
  it("deletes metrics older than retention period", () => {
    cleanup(720);

    const now = Math.floor(Date.now() / 1000);
    const expectedCutoff = now - 720 * 3600;

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM metrics_history")
    );
    expect(mockRun).toHaveBeenCalledWith(expectedCutoff);
  });
});
