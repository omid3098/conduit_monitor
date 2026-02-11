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

import { GET, POST } from "./route";
import { NextRequest } from "next/server";

beforeEach(() => vi.clearAllMocks());

describe("GET /api/servers", () => {
  it("returns servers with tags", async () => {
    mockAll
      .mockReturnValueOnce([
        { id: "s1", label: "Server 1", server_id: "agent-1", created_at: "2025-01-01", last_seen_at: null, first_seen_at: null },
      ])
      .mockReturnValueOnce([
        { server_id: "s1", tag: "production" },
        { server_id: "s1", tag: "us-east" },
      ]);

    const res = await GET();
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("s1");
    expect(body[0].tags).toEqual(["production", "us-east"]);
    // Should NOT include host, port, or secret
    expect(body[0].host).toBeUndefined();
    expect(body[0].port).toBeUndefined();
    expect(body[0].secret).toBeUndefined();
  });

  it("returns empty array when no servers", async () => {
    mockAll.mockReturnValueOnce([]).mockReturnValueOnce([]);

    const res = await GET();
    const body = await res.json();
    expect(body).toEqual([]);
  });
});

describe("POST /api/servers", () => {
  function makePostRequest(bodyObj: object) {
    return new NextRequest(new URL("http://localhost/api/servers"), {
      method: "POST",
      body: JSON.stringify(bodyObj),
      headers: { "Content-Type": "application/json" },
    });
  }

  it("creates a server with valid URI", async () => {
    mockGet.mockReturnValueOnce(undefined); // no duplicate

    const req = makePostRequest({
      uri: "conduit://secret@host.com:8080",
      label: "My Server",
      tags: ["Production", "  US-East  "],
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.label).toBe("My Server");
    expect(body.tags).toEqual(["production", "us-east"]); // normalized
    expect(body.server_id).toBeNull();
  });

  it("returns 400 for invalid URI", async () => {
    const req = makePostRequest({ uri: "http://bad-uri" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate host:port", async () => {
    mockGet.mockReturnValueOnce({ id: "existing" }); // duplicate found

    const req = makePostRequest({ uri: "conduit://secret@host.com:8080" });
    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it("handles empty tags array", async () => {
    mockGet.mockReturnValueOnce(undefined);

    const req = makePostRequest({
      uri: "conduit://secret@host.com:8080",
      tags: [],
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.tags).toEqual([]);
  });

  it("filters empty tag strings", async () => {
    mockGet.mockReturnValueOnce(undefined);

    const req = makePostRequest({
      uri: "conduit://secret@host.com:8080",
      tags: ["  ", "valid", ""],
    });

    const res = await POST(req);
    const body = await res.json();
    expect(body.tags).toEqual(["valid"]);
  });
});
