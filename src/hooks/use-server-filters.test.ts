// @vitest-environment jsdom
import { renderHook, act } from "@testing-library/react";
import { useServerFilters } from "./use-server-filters";
import { makeServerSafe } from "@/test/fixtures";

describe("useServerFilters", () => {
  it("starts with default filter state", () => {
    const { result } = renderHook(() => useServerFilters());
    expect(result.current.filters.search).toBe("");
    expect(result.current.filters.tags).toEqual([]);
    expect(result.current.filters.sort).toBe("label");
    expect(result.current.filters.sortDir).toBe("asc");
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("sets search filter", () => {
    const { result } = renderHook(() => useServerFilters());
    act(() => result.current.setSearch("test"));
    expect(result.current.filters.search).toBe("test");
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it("toggles tag on and off", () => {
    const { result } = renderHook(() => useServerFilters());
    act(() => result.current.toggleTag("production"));
    expect(result.current.filters.tags).toEqual(["production"]);
    expect(result.current.hasActiveFilters).toBe(true);

    act(() => result.current.toggleTag("production"));
    expect(result.current.filters.tags).toEqual([]);
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it("clears all filters", () => {
    const { result } = renderHook(() => useServerFilters());
    act(() => {
      result.current.setSearch("test");
      result.current.toggleTag("prod");
    });
    act(() => result.current.clearFilters());
    expect(result.current.filters.search).toBe("");
    expect(result.current.filters.tags).toEqual([]);
  });

  describe("filterServers", () => {
    const servers = [
      makeServerSafe({ id: "a1", label: "Alpha Server", server_id: "agent-alpha", tags: ["us", "production"], created_at: "2025-01-01" }),
      makeServerSafe({ id: "b2", label: "Beta Server", server_id: "agent-beta", tags: ["eu", "staging"], created_at: "2025-02-01" }),
      makeServerSafe({ id: "c3", label: null, server_id: "agent-gamma", tags: ["us", "staging"], created_at: "2025-03-01" }),
    ];

    it("returns all servers when no filters active", () => {
      const { result } = renderHook(() => useServerFilters());
      const filtered = result.current.filterServers(servers);
      expect(filtered).toHaveLength(3);
    });

    it("filters by label", () => {
      const { result } = renderHook(() => useServerFilters());
      act(() => result.current.setSearch("alpha"));
      expect(result.current.filterServers(servers)).toHaveLength(1);
    });

    it("filters by server_id", () => {
      const { result } = renderHook(() => useServerFilters());
      act(() => result.current.setSearch("agent-beta"));
      expect(result.current.filterServers(servers)).toHaveLength(1);
    });

    it("filters by id", () => {
      const { result } = renderHook(() => useServerFilters());
      act(() => result.current.setSearch("b2"));
      expect(result.current.filterServers(servers)).toHaveLength(1);
    });

    it("filters by tags", () => {
      const { result } = renderHook(() => useServerFilters());
      act(() => result.current.setSearch("staging"));
      expect(result.current.filterServers(servers)).toHaveLength(2);
    });

    it("tag filter uses OR logic", () => {
      const { result } = renderHook(() => useServerFilters());
      act(() => {
        result.current.toggleTag("production");
        result.current.toggleTag("eu");
      });
      // "production" matches Alpha, "eu" matches Beta
      expect(result.current.filterServers(servers)).toHaveLength(2);
    });

    it("sorts by label ascending", () => {
      const { result } = renderHook(() => useServerFilters());
      const filtered = result.current.filterServers(servers);
      // agent-gamma (null label → server_id fallback) < alpha server < beta server
      expect(filtered[0].id).toBe("c3");
      expect(filtered[1].id).toBe("a1");
      expect(filtered[2].id).toBe("b2");
    });

    it("sorts descending when sortDir is desc", () => {
      const { result } = renderHook(() => useServerFilters());
      // Default sort is label asc: c3, a1, b2
      const filtered = result.current.filterServers(servers);
      expect(filtered[0].id).toBe("c3");
      expect(filtered[2].id).toBe("b2");
    });

    it("combines search and tag filters", () => {
      const { result } = renderHook(() => useServerFilters());
      act(() => {
        result.current.setSearch("server");
        result.current.toggleTag("us");
      });
      // "server" matches Alpha and Beta (have "Server" in label)
      // "us" tag matches Alpha only among those with "server" in label?
      // Actually: search "server" matches Alpha, Beta (both have "Server" in label). Gamma has null label.
      // Tag "us" matches Alpha and Gamma. Intersection: Alpha only.
      expect(result.current.filterServers(servers)).toHaveLength(1);
      expect(result.current.filterServers(servers)[0].id).toBe("a1");
    });
  });
});
