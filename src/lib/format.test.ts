import {
  formatBytes,
  formatGoDuration,
  formatCpu,
  formatMemory,
  formatMbps,
  formatDuration,
  formatPercent,
  formatCompact,
  formatRelativeTime,
  formatCountryCode,
} from "./format";

describe("formatBytes", () => {
  it("returns '0 B' for zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formats bytes", () => {
    expect(formatBytes(500)).toBe("500.0 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1048576)).toBe("1.0 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1073741824)).toBe("1.0 GB");
  });

  it("formats terabytes", () => {
    expect(formatBytes(1099511627776)).toBe("1.0 TB");
  });
});

describe("formatGoDuration", () => {
  it("returns '0s' for zero duration", () => {
    expect(formatGoDuration("0s")).toBe("0s");
  });

  it("formats seconds only", () => {
    expect(formatGoDuration("30s")).toBe("30s");
  });

  it("formats minutes and seconds", () => {
    expect(formatGoDuration("5m30s")).toBe("5m 30s");
  });

  it("formats hours, minutes, and seconds", () => {
    expect(formatGoDuration("2h5m30s")).toBe("2h 5m 30s");
  });

  it("converts hours to days", () => {
    expect(formatGoDuration("25h5m30s")).toBe("1d 1h 5m");
  });

  it("suppresses seconds when days > 0", () => {
    expect(formatGoDuration("48h0m10s")).toBe("2d");
  });

  it("formats exact days", () => {
    expect(formatGoDuration("48h0m0s")).toBe("2d");
  });

  it("returns '0s' when regex matches empty groups", () => {
    // The regex always matches (all groups optional), so "invalid" → "0s"
    expect(formatGoDuration("invalid")).toBe("0s");
  });

  it("returns '0s' for all-zero parts", () => {
    expect(formatGoDuration("0h0m0s")).toBe("0s");
  });
});

describe("formatCpu", () => {
  it("formats zero", () => {
    expect(formatCpu(0)).toBe("0.0%");
  });

  it("formats with one decimal place", () => {
    expect(formatCpu(45.23)).toBe("45.2%");
  });

  it("handles rounding", () => {
    expect(formatCpu(99.95)).toBe("100.0%");
  });
});

describe("formatMemory", () => {
  it("formats megabytes", () => {
    expect(formatMemory(512)).toBe("512 MB");
  });

  it("formats gigabytes at threshold", () => {
    expect(formatMemory(1024)).toBe("1.0 GB");
  });

  it("formats gigabytes with decimals", () => {
    expect(formatMemory(2560)).toBe("2.5 GB");
  });
});

describe("formatMbps", () => {
  it("formats megabits", () => {
    expect(formatMbps(0)).toBe("0.0 Mbps");
    expect(formatMbps(500.5)).toBe("500.5 Mbps");
  });

  it("formats gigabits at threshold", () => {
    expect(formatMbps(1000)).toBe("1.0 Gbps");
  });

  it("formats gigabits with decimals", () => {
    expect(formatMbps(2500)).toBe("2.5 Gbps");
  });
});

describe("formatDuration", () => {
  it("formats seconds", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(30)).toBe("30s");
    expect(formatDuration(59)).toBe("59s");
  });

  it("formats minutes", () => {
    expect(formatDuration(60)).toBe("1m");
  });

  it("formats hours and minutes", () => {
    expect(formatDuration(3661)).toBe("1h 1m");
  });

  it("formats days", () => {
    expect(formatDuration(86400)).toBe("1d");
  });

  it("formats days, hours, and minutes", () => {
    expect(formatDuration(90061)).toBe("1d 1h 1m");
  });
});

describe("formatPercent", () => {
  it("returns '0%' for zero total", () => {
    expect(formatPercent(0, 0)).toBe("0%");
    expect(formatPercent(50, 0)).toBe("0%");
  });

  it("formats percentage with one decimal", () => {
    expect(formatPercent(50, 100)).toBe("50.0%");
  });

  it("handles non-round percentages", () => {
    expect(formatPercent(1, 3)).toBe("33.3%");
  });
});

describe("formatCompact", () => {
  it("returns plain number for small values", () => {
    expect(formatCompact(0)).toBe("0");
    expect(formatCompact(999)).toBe("999");
  });

  it("formats thousands", () => {
    expect(formatCompact(1000)).toBe("1.0K");
    expect(formatCompact(1500)).toBe("1.5K");
  });

  it("formats millions", () => {
    expect(formatCompact(1000000)).toBe("1.0M");
    expect(formatCompact(1500000)).toBe("1.5M");
  });
});

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for recent timestamps", () => {
    expect(formatRelativeTime("2025-06-15T11:59:30Z")).toBe("just now");
  });

  it("formats minutes ago", () => {
    expect(formatRelativeTime("2025-06-15T11:55:00Z")).toBe("5m ago");
  });

  it("formats hours ago", () => {
    expect(formatRelativeTime("2025-06-15T10:00:00Z")).toBe("2h ago");
  });

  it("formats days ago", () => {
    expect(formatRelativeTime("2025-06-13T12:00:00Z")).toBe("2d ago");
  });
});

describe("formatCountryCode", () => {
  it("formats known country codes", () => {
    expect(formatCountryCode("US")).toBe("United States");
  });

  it("handles lowercase input", () => {
    expect(formatCountryCode("de")).toBe("Germany");
  });

  it("returns string for unknown codes", () => {
    const result = formatCountryCode("XX");
    expect(typeof result).toBe("string");
  });
});
