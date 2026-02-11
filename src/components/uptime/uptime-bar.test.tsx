// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { UptimeBar } from "./uptime-bar";

describe("UptimeBar", () => {
  it("renders correct number of segments", () => {
    const { container } = render(
      <UptimeBar rangeSeconds={86400} incidents={[]} segments={10} />
    );
    const segments = container.querySelectorAll("[title]");
    // Parent div has title="Uptime history", each segment also has title
    // Segments are the flex children
    const bar = container.querySelector('[title="Uptime history"]');
    expect(bar?.children).toHaveLength(10);
  });

  it("all segments are green when no incidents", () => {
    const { container } = render(
      <UptimeBar rangeSeconds={86400} incidents={[]} segments={5} />
    );
    const bar = container.querySelector('[title="Uptime history"]');
    const segments = Array.from(bar?.children ?? []);
    segments.forEach((seg) => {
      expect(seg.className).toContain("bg-emerald-500");
    });
  });

  it("marks segments as down during incidents", () => {
    const now = Math.floor(Date.now() / 1000);
    // Incident covering the last 50% of the range
    const incidents = [{ start: now - 43200, end: now }];
    const { container } = render(
      <UptimeBar rangeSeconds={86400} incidents={incidents} segments={4} />
    );
    const bar = container.querySelector('[title="Uptime history"]');
    const segments = Array.from(bar?.children ?? []);
    // First 2 segments should be up, last 2 should be down
    expect(segments[0].className).toContain("bg-emerald-500");
    expect(segments[1].className).toContain("bg-emerald-500");
    expect(segments[2].className).toContain("bg-red-500");
    expect(segments[3].className).toContain("bg-red-500");
  });

  it("handles ongoing incidents (no end)", () => {
    const now = Math.floor(Date.now() / 1000);
    const incidents = [{ start: now - 100 }]; // ongoing
    const { container } = render(
      <UptimeBar rangeSeconds={86400} incidents={incidents as any} segments={10} />
    );
    const bar = container.querySelector('[title="Uptime history"]');
    const segments = Array.from(bar?.children ?? []);
    // Last segment should be down
    const lastSeg = segments[segments.length - 1];
    expect(lastSeg.className).toContain("bg-red-500");
  });

  it("defaults to 90 segments", () => {
    const { container } = render(
      <UptimeBar rangeSeconds={86400} incidents={[]} />
    );
    const bar = container.querySelector('[title="Uptime history"]');
    expect(bar?.children).toHaveLength(90);
  });
});
