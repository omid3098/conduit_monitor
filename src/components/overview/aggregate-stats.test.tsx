// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { AggregateStats } from "./aggregate-stats";

vi.mock("@/hooks/use-uptime", () => ({
  useFleetUptime: vi.fn(() => ({
    data: { fleet_uptime_percent: 99.5, server_uptimes: [] },
    isLoading: false,
  })),
}));

describe("AggregateStats", () => {
  it("renders server counts", () => {
    const serversData = [
      { data: undefined, connectionState: "online" as const },
      { data: undefined, connectionState: "offline" as const },
    ];
    render(<AggregateStats serversData={serversData} />);
    expect(screen.getByText("2")).toBeInTheDocument(); // total servers
    expect(screen.getByText(/1 on/)).toBeInTheDocument();
  });

  it("renders connected client totals", () => {
    const serversData = [
      {
        data: {
          connected_clients: 5,
          connecting_clients: 3,
          system: { cpu_percent: 50, net_in_mbps: 10, net_out_mbps: 20, memory_used_mb: 1024, memory_total_mb: 2048, disk_used_gb: 0, disk_total_gb: 0, os: "linux", arch: "x64", hostname: "h", go_version: "1" },
          session: { total_upload_bytes: 1000, total_download_bytes: 2000 },
          total_containers: 4,
          containers: [],
          settings: { max_clients: 50 },
          version: "1",
          uptime_seconds: 100,
          clients_by_country: [],
        },
        connectionState: "online" as const,
      },
    ];
    render(<AggregateStats serversData={serversData} />);
    expect(screen.getByText("5")).toBeInTheDocument(); // connected
    expect(screen.getByText("3")).toBeInTheDocument(); // connecting
    expect(screen.getByText("4")).toBeInTheDocument(); // containers
    expect(screen.getByText("Connected")).toBeInTheDocument();
    expect(screen.getByText("Connecting")).toBeInTheDocument();
  });

  it("renders fleet uptime", () => {
    render(<AggregateStats serversData={[]} />);
    expect(screen.getByText("99.5%")).toBeInTheDocument();
    expect(screen.getByText("24h fleet avg")).toBeInTheDocument();
  });

  it("shows zero CPU when no servers online", () => {
    render(<AggregateStats serversData={[]} />);
    expect(screen.getByText("0.0%")).toBeInTheDocument(); // avg CPU
  });
});
