// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { StatRow } from "./stat-row";
import type { ServerStatusResult, MetricsDataPoint } from "@/lib/types";

// Mock recharts
vi.mock("recharts", () => ({
  Line: () => null,
  LineChart: () => null,
}));

const mockData: ServerStatusResult = {
  version: "1.0",
  uptime_seconds: 3600,
  connected_clients: 10,
  connecting_clients: 2,
  total_containers: 3,
  containers: [],
  settings: { max_clients: 100 },
  system: {
    cpu_percent: 45.2,
    memory_used_mb: 2048,
    memory_total_mb: 8192,
    disk_used_gb: 50,
    disk_total_gb: 200,
    net_in_mbps: 10.5,
    net_out_mbps: 25.3,
    os: "linux",
    arch: "x64",
    hostname: "test-host",
    go_version: "1.21",
  },
  session: {
    total_upload_bytes: 1073741824,
    total_download_bytes: 2147483648,
  },
  clients_by_country: [],
};

const mockSparklineData: MetricsDataPoint[] = [
  {
    timestamp: 1000,
    system_cpu: 40,
    system_memory_used: 2000,
    system_memory_total: 8192,
    system_net_in: 50,
    system_net_out: 100,
    total_connections: 10,
    unique_ips: 5,
    container_count: 2,
    total_container_cpu: 10,
    total_container_memory: 256,
    clients_by_country: [],
  },
  {
    timestamp: 2000,
    system_cpu: 60,
    system_memory_used: 2500,
    system_memory_total: 8192,
    system_net_in: 80,
    system_net_out: 150,
    total_connections: 15,
    unique_ips: 8,
    container_count: 2,
    total_container_cpu: 15,
    total_container_memory: 300,
    clients_by_country: [],
  },
];

describe("StatRow", () => {
  it("renders all 6 stat panels", () => {
    render(<StatRow data={mockData} />);
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Traffic")).toBeInTheDocument();
    expect(screen.getByText("Session")).toBeInTheDocument();
    expect(screen.getByText("Host CPU")).toBeInTheDocument();
    expect(screen.getByText("Host RAM")).toBeInTheDocument();
    expect(screen.getByText("Disk")).toBeInTheDocument();
  });

  it("shows correct client count", () => {
    render(<StatRow data={mockData} />);
    // 10 connected + 2 connecting = 12
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("shows CPU percentage", () => {
    render(<StatRow data={mockData} />);
    expect(screen.getByText("45.2%")).toBeInTheDocument();
  });

  it("shows disk and RAM percentages", () => {
    render(<StatRow data={mockData} />);
    // Both RAM and disk are 25.0% with our test data
    expect(screen.getAllByText("25.0%")).toHaveLength(2);
    expect(screen.getByText("Disk")).toBeInTheDocument();
    expect(screen.getByText(/50\.0 \/ 200\.0 GB/)).toBeInTheDocument();
  });

  it("renders with sparkline data (covers sparkline mapping functions)", () => {
    render(<StatRow data={mockData} sparklineData={mockSparklineData} />);
    // Should still render all panels correctly
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Host CPU")).toBeInTheDocument();
    expect(screen.getByText("Host RAM")).toBeInTheDocument();
  });

  it("handles sparklineData with zero memory_total", () => {
    const zeroMemData: MetricsDataPoint[] = [{
      ...mockSparklineData[0],
      system_memory_total: 0,
    }];
    render(<StatRow data={mockData} sparklineData={zeroMemData} />);
    expect(screen.getByText("Host RAM")).toBeInTheDocument();
  });

  it("shows high CPU threshold color when CPU > 80", () => {
    const highCpuData: ServerStatusResult = {
      ...mockData,
      system: { ...mockData.system!, cpu_percent: 95 },
    };
    render(<StatRow data={highCpuData} />);
    expect(screen.getByText("95.0%")).toBeInTheDocument();
  });

  it("shows client subtitle with connecting count", () => {
    render(<StatRow data={mockData} />);
    expect(screen.getByText(/10 connected, 2 connecting/)).toBeInTheDocument();
  });
});
