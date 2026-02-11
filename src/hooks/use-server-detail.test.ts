// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { useServer } from "./use-server-detail";
import { createWrapper } from "@/test/helpers";
import { makeServerSafe } from "@/test/fixtures";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useServer", () => {
  it("fetches single server", async () => {
    const server = makeServerSafe();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(server), { status: 200 })
    );

    const { result } = renderHook(() => useServer("test-uuid-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe("test-uuid-1");
    expect(fetch).toHaveBeenCalledWith("/api/servers/test-uuid-1");
  });

  it("throws on error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Not found", { status: 404 })
    );

    const { result } = renderHook(() => useServer("bad-id"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
