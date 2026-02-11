const { mockGet, mockPrepare } = vi.hoisted(() => {
  const mockGet = vi.fn();
  const mockPrepare = vi.fn(() => ({ get: mockGet, all: vi.fn(), run: vi.fn() }));
  return { mockGet, mockPrepare };
});

vi.mock("@/lib/db", () => ({ default: { prepare: mockPrepare } }));

import { GET } from "./route";
import { NextRequest } from "next/server";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => vi.unstubAllGlobals());

const params = (id: string) => ({ params: Promise.resolve({ id }) });
const req = new NextRequest(new URL("http://localhost/api/servers/test-id/health"));

describe("GET /api/servers/[id]/health", () => {
  it("returns 404 when server not found", async () => {
    mockGet.mockReturnValueOnce(undefined);
    const res = await GET(req, params("bad"));
    expect(res.status).toBe(404);
  });

  it("proxies healthy response", async () => {
    mockGet.mockReturnValueOnce({ host: "192.168.1.1", port: 8080 });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "healthy" }), { status: 200 })
    );

    const res = await GET(req, params("test-id"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
  });

  it("returns 502 for unhealthy agent", async () => {
    mockGet.mockReturnValueOnce({ host: "192.168.1.1", port: 8080 });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Error", { status: 500 })
    );

    const res = await GET(req, params("test-id"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("unhealthy");
  });

  it("returns 502 when agent unreachable", async () => {
    mockGet.mockReturnValueOnce({ host: "192.168.1.1", port: 8080 });
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Connection refused"));

    const res = await GET(req, params("test-id"));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("offline");
  });
});
