const { mockAll, mockPrepare } = vi.hoisted(() => {
  const mockAll = vi.fn((): unknown[] => []);
  const mockPrepare = vi.fn(() => ({ all: mockAll, get: vi.fn(), run: vi.fn() }));
  return { mockAll, mockPrepare };
});

vi.mock("@/lib/db", () => ({ default: { prepare: mockPrepare } }));

import { GET } from "./route";

beforeEach(() => vi.clearAllMocks());

describe("GET /api/tags", () => {
  it("returns sorted distinct tags", async () => {
    mockAll.mockReturnValueOnce([{ tag: "eu" }, { tag: "production" }, { tag: "us" }]);
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual(["eu", "production", "us"]);
  });

  it("returns empty array when no tags", async () => {
    mockAll.mockReturnValueOnce([]);
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual([]);
  });
});
