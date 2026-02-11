const {
  mockRun, mockGet, mockPrepare,
  mockStoreSnapshot, mockCleanup,
  mockInitializeState, mockRecordStatusResult,
} = vi.hoisted(() => {
  const mockRun = vi.fn((): { changes: number } => ({ changes: 1 }));
  const mockGet = vi.fn();
  const mockPrepare = vi.fn(() => ({
    run: mockRun,
    get: mockGet,
    all: vi.fn(() => []),
  }));
  return {
    mockRun, mockGet, mockPrepare,
    mockStoreSnapshot: vi.fn(),
    mockCleanup: vi.fn(),
    mockInitializeState: vi.fn(),
    mockRecordStatusResult: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({ default: { prepare: mockPrepare } }));
vi.mock("@/lib/metrics-store", () => ({
  storeSnapshot: mockStoreSnapshot,
  cleanup: mockCleanup,
}));
vi.mock("@/lib/uptime-store", () => ({
  initializeState: mockInitializeState,
  recordStatusResult: mockRecordStatusResult,
}));

import { GET } from "./route";
import { NextRequest } from "next/server";
import { makeAgentStatus } from "@/test/fixtures";

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const req = new NextRequest(new URL("http://localhost/api/servers/test-id/status"));

const serverRow = {
  id: "test-id",
  host: "192.168.1.1",
  port: 8080,
  secret: "mysecret",
  label: "Test",
  server_id: "agent-1",
  created_at: "2025-01-01",
  last_seen_at: "2025-06-15T11:59:00Z",
  first_seen_at: "2025-01-01",
};

describe("GET /api/servers/[id]/status", () => {
  it("returns 404 when server not found", async () => {
    mockGet.mockReturnValueOnce(undefined);
    const res = await GET(req, params("bad-id"));
    expect(res.status).toBe(404);
  });

  it("returns data with stale flag on success", async () => {
    const agentData = makeAgentStatus({
      timestamp: Math.floor(Date.now() / 1000), // not stale
    });
    mockGet.mockReturnValueOnce(serverRow);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(agentData), { status: 200 })
    );

    const res = await GET(req, params("test-id"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stale).toBe(false);
    expect(body.server_id).toBe(agentData.server_id);
    expect(mockRecordStatusResult).toHaveBeenCalledWith("test-id", true);
    expect(mockStoreSnapshot).toHaveBeenCalled();
  });

  it("detects stale data", async () => {
    const agentData = makeAgentStatus({
      timestamp: Math.floor(Date.now() / 1000) - 120, // 2min old = stale
    });
    mockGet.mockReturnValueOnce(serverRow);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(agentData), { status: 200 })
    );

    const res = await GET(req, params("test-id"));
    const body = await res.json();
    expect(body.stale).toBe(true);
  });

  it("handles 401 auth failure", async () => {
    mockGet.mockReturnValueOnce(serverRow);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );

    const res = await GET(req, params("test-id"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("auth_failed");
    expect(mockRecordStatusResult).toHaveBeenCalledWith("test-id", false);
  });

  it("handles 503 starting up", async () => {
    mockGet.mockReturnValueOnce(serverRow);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Starting", { status: 503 })
    );

    const res = await GET(req, params("test-id"));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("starting_up");
  });

  it("handles other agent errors as 502", async () => {
    mockGet.mockReturnValueOnce(serverRow);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Error", { status: 500 })
    );

    const res = await GET(req, params("test-id"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("agent_error");
  });

  it("handles fetch failure as offline", async () => {
    mockGet.mockReturnValueOnce(serverRow);
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Connection refused"));

    const res = await GET(req, params("test-id"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("offline");
    expect(mockRecordStatusResult).toHaveBeenCalledWith("test-id", false);
  });

  it("handles abort/timeout as 504", async () => {
    mockGet.mockReturnValueOnce(serverRow);
    const abortError = Object.assign(new Error("The operation was aborted"), { name: "AbortError" });
    vi.mocked(fetch).mockRejectedValueOnce(abortError);

    const res = await GET(req, params("test-id"));
    expect(res.status).toBe(504);
    const body = await res.json();
    expect(body.error).toBe("timeout");
  });

  it("updates server_id when it changes", async () => {
    const agentData = makeAgentStatus({
      server_id: "new-agent-id",
      timestamp: Math.floor(Date.now() / 1000),
    });
    mockGet.mockReturnValueOnce({ ...serverRow, server_id: "old-id" });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(agentData), { status: 200 })
    );

    await GET(req, params("test-id"));

    // Check that prepare was called with UPDATE containing server_id
    const updateCalls = mockPrepare.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("SET server_id")
    );
    expect(updateCalls.length).toBeGreaterThan(0);
  });

  it("does not fail when storeSnapshot throws", async () => {
    const agentData = makeAgentStatus({
      timestamp: Math.floor(Date.now() / 1000),
    });
    mockGet.mockReturnValueOnce(serverRow);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(agentData), { status: 200 })
    );
    mockStoreSnapshot.mockImplementationOnce(() => {
      throw new Error("Storage failed");
    });

    const res = await GET(req, params("test-id"));
    expect(res.status).toBe(200); // should still succeed
  });
});
