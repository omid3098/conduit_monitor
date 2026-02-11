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

vi.mock("@/lib/db", () => ({ default: { prepare: mockPrepare } }));

import { GET, PATCH, DELETE } from "./route";
import { NextRequest } from "next/server";

beforeEach(() => vi.clearAllMocks());

const params = (id: string) => ({ params: Promise.resolve({ id }) });

const serverRow = {
  id: "test-id",
  label: "Test",
  server_id: "agent-1",
  created_at: "2025-01-01",
  last_seen_at: null,
  first_seen_at: null,
};

describe("GET /api/servers/[id]", () => {
  it("returns server with tags", async () => {
    mockGet.mockReturnValueOnce(serverRow);
    mockAll.mockReturnValueOnce([{ tag: "prod" }]);

    const res = await GET(
      new NextRequest(new URL("http://localhost/api/servers/test-id")),
      params("test-id")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("test-id");
    expect(body.tags).toEqual(["prod"]);
  });

  it("returns 404 for non-existent server", async () => {
    mockGet.mockReturnValueOnce(undefined);

    const res = await GET(
      new NextRequest(new URL("http://localhost/api/servers/bad-id")),
      params("bad-id")
    );
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/servers/[id]", () => {
  function makePatch(body: object) {
    return new NextRequest(new URL("http://localhost/api/servers/test-id"), {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
  }

  it("updates label", async () => {
    mockRun.mockReturnValueOnce({ changes: 1 });
    mockGet.mockReturnValueOnce({ ...serverRow, label: "New Label" });
    mockAll.mockReturnValueOnce([]);

    const res = await PATCH(makePatch({ label: "New Label" }), params("test-id"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.label).toBe("New Label");
  });

  it("updates tags", async () => {
    mockGet.mockReturnValueOnce(serverRow);
    mockAll.mockReturnValueOnce([{ tag: "new-tag" }]);

    const res = await PATCH(makePatch({ tags: ["New-Tag"] }), params("test-id"));
    expect(res.status).toBe(200);
  });

  it("returns 404 when server not found during label update", async () => {
    mockRun.mockReturnValueOnce({ changes: 0 });

    const res = await PATCH(makePatch({ label: "Test" }), params("bad-id"));
    expect(res.status).toBe(404);
  });

  it("returns 404 when server not found after tag update", async () => {
    mockGet.mockReturnValueOnce(undefined); // server query after updates

    const res = await PATCH(makePatch({ tags: ["tag"] }), params("bad-id"));
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/servers/[id]", () => {
  it("deletes existing server", async () => {
    mockRun.mockReturnValueOnce({ changes: 1 });

    const res = await DELETE(
      new NextRequest(new URL("http://localhost/api/servers/test-id")),
      params("test-id")
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 404 for non-existent server", async () => {
    mockRun.mockReturnValueOnce({ changes: 0 });

    const res = await DELETE(
      new NextRequest(new URL("http://localhost/api/servers/bad-id")),
      params("bad-id")
    );
    expect(res.status).toBe(404);
  });
});
