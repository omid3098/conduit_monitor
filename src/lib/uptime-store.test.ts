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

// We reset modules between tests to clear the in-memory lastKnownState Map
let initializeState: typeof import("./uptime-store").initializeState;
let recordStatusResult: typeof import("./uptime-store").recordStatusResult;
let computeUptime: typeof import("./uptime-store").computeUptime;

beforeEach(async () => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));

  vi.resetModules();
  const mod = await import("./uptime-store");
  initializeState = mod.initializeState;
  recordStatusResult = mod.recordStatusResult;
  computeUptime = mod.computeUptime;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("initializeState", () => {
  it("loads last known state from DB", () => {
    mockGet.mockReturnValueOnce({ event_type: "online" });
    initializeState("server-1");

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining("SELECT event_type FROM uptime_events")
    );
    expect(mockGet).toHaveBeenCalledWith("server-1");
  });

  it("does nothing when no prior events exist", () => {
    mockGet.mockReturnValueOnce(undefined);
    initializeState("server-1");
    expect(mockGet).toHaveBeenCalledWith("server-1");
  });

  it("is a no-op on second call for same server", () => {
    mockGet.mockReturnValueOnce({ event_type: "online" });
    initializeState("server-1");
    initializeState("server-1");
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});

describe("recordStatusResult", () => {
  it("records first status when no prior state", () => {
    recordStatusResult("server-1", true);

    expect(mockPrepare).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO uptime_events")
    );
    expect(mockRun).toHaveBeenCalledWith(
      "server-1", "online", expect.any(Number)
    );
  });

  it("does not record duplicate state", () => {
    recordStatusResult("server-1", true);
    vi.clearAllMocks();
    recordStatusResult("server-1", true);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("records state transition online -> offline", () => {
    recordStatusResult("server-1", true);
    vi.clearAllMocks();
    recordStatusResult("server-1", false);
    expect(mockRun).toHaveBeenCalledWith(
      "server-1", "offline", expect.any(Number)
    );
  });

  it("records state transition offline -> online", () => {
    recordStatusResult("server-1", false);
    vi.clearAllMocks();
    recordStatusResult("server-1", true);
    expect(mockRun).toHaveBeenCalledWith(
      "server-1", "online", expect.any(Number)
    );
  });
});

describe("computeUptime", () => {
  const NOW = Math.floor(new Date("2025-06-15T12:00:00Z").getTime() / 1000);
  const RANGE = 86400;
  const SINCE = NOW - RANGE;

  it("returns 0% when always offline with no events", () => {
    mockAll.mockReturnValueOnce([]);
    mockGet.mockReturnValueOnce(undefined);

    const result = computeUptime("server-1", RANGE);
    expect(result.uptimePercent).toBe(0);
    expect(result.downtimeIncidents).toHaveLength(1);
    expect(result.downtimeIncidents[0].end).toBeNull();
  });

  it("returns 100% when always online", () => {
    mockAll.mockReturnValueOnce([]);
    mockGet.mockReturnValueOnce({ event_type: "online" });

    const result = computeUptime("server-1", RANGE);
    expect(result.uptimePercent).toBe(100);
    expect(result.downtimeIncidents).toHaveLength(0);
  });

  it("calculates partial uptime with transitions", () => {
    const halfwayPoint = SINCE + RANGE / 2;

    mockAll.mockReturnValueOnce([
      { event_type: "offline", timestamp: halfwayPoint },
    ]);
    mockGet.mockReturnValueOnce({ event_type: "online" });

    const result = computeUptime("server-1", RANGE);
    expect(result.uptimePercent).toBeCloseTo(50, 0);
    expect(result.downtimeIncidents).toHaveLength(1);
    expect(result.downtimeIncidents[0].start).toBe(halfwayPoint);
    expect(result.downtimeIncidents[0].end).toBeNull();
  });

  it("handles online->offline->online transitions", () => {
    const offlineAt = SINCE + RANGE * 0.25;
    const onlineAt = SINCE + RANGE * 0.75;

    mockAll.mockReturnValueOnce([
      { event_type: "offline", timestamp: offlineAt },
      { event_type: "online", timestamp: onlineAt },
    ]);
    mockGet.mockReturnValueOnce({ event_type: "online" });

    const result = computeUptime("server-1", RANGE);
    expect(result.uptimePercent).toBeCloseTo(50, 0);
    expect(result.downtimeIncidents).toHaveLength(1);
    expect(result.downtimeIncidents[0].start).toBe(offlineAt);
    expect(result.downtimeIncidents[0].end).toBe(onlineAt);
    expect(result.downtimeIncidents[0].duration).toBe(onlineAt - offlineAt);
  });

  it("handles starting offline with recovery", () => {
    const onlineAt = SINCE + RANGE / 2;

    mockAll.mockReturnValueOnce([
      { event_type: "online", timestamp: onlineAt },
    ]);
    mockGet.mockReturnValueOnce({ event_type: "offline" });

    const result = computeUptime("server-1", RANGE);
    expect(result.uptimePercent).toBeCloseTo(50, 0);
    expect(result.downtimeIncidents).toHaveLength(1);
    expect(result.downtimeIncidents[0].start).toBe(SINCE);
    expect(result.downtimeIncidents[0].end).toBe(onlineAt);
  });

  it("handles multiple incidents", () => {
    const off1 = SINCE + 1000;
    const on1 = SINCE + 2000;
    const off2 = SINCE + 3000;
    const on2 = SINCE + 4000;

    mockAll.mockReturnValueOnce([
      { event_type: "offline", timestamp: off1 },
      { event_type: "online", timestamp: on1 },
      { event_type: "offline", timestamp: off2 },
      { event_type: "online", timestamp: on2 },
    ]);
    mockGet.mockReturnValueOnce({ event_type: "online" });

    const result = computeUptime("server-1", RANGE);
    expect(result.downtimeIncidents).toHaveLength(2);
    expect(result.downtimeIncidents[0].duration).toBe(1000);
    expect(result.downtimeIncidents[1].duration).toBe(1000);
  });
});
