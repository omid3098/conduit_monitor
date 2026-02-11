// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { UptimeSummary } from "./uptime-summary";

vi.mock("@/hooks/use-uptime", () => ({
  useServerUptime: vi.fn((serverId: string, range: string) => {
    const data: Record<string, { uptime_percent: number; downtime_incidents: { start: number; end: number }[] }> = {
      "24h": { uptime_percent: 99.9, downtime_incidents: [] },
      "7d": { uptime_percent: 99.5, downtime_incidents: [] },
      "30d": { uptime_percent: 98.2, downtime_incidents: [] },
    };
    return { data: data[range], isLoading: false };
  }),
}));

describe("UptimeSummary", () => {
  it("renders uptime percentages for all three ranges", () => {
    render(<UptimeSummary serverId="s1" />);
    expect(screen.getByText("99.9%")).toBeInTheDocument();
    expect(screen.getByText("99.5%")).toBeInTheDocument();
    expect(screen.getByText("98.2%")).toBeInTheDocument();
  });

  it("renders range labels", () => {
    render(<UptimeSummary serverId="s1" />);
    expect(screen.getByText("24h")).toBeInTheDocument();
    expect(screen.getByText("7d")).toBeInTheDocument();
    expect(screen.getByText("30d")).toBeInTheDocument();
  });

  it("renders Uptime heading", () => {
    render(<UptimeSummary serverId="s1" />);
    expect(screen.getByText("Uptime")).toBeInTheDocument();
  });

  it("renders uptime bar for 30d data", () => {
    const { container } = render(<UptimeSummary serverId="s1" />);
    expect(container.querySelector('[title="Uptime history"]')).toBeInTheDocument();
  });

  it("shows timeline labels", () => {
    render(<UptimeSummary serverId="s1" />);
    expect(screen.getByText("30 days ago")).toBeInTheDocument();
    expect(screen.getByText("Now")).toBeInTheDocument();
  });
});
