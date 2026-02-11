import type {
  AgentStatusResponse,
  ServerSafe,
  ServerRow,
  MetricsDataPoint,
  AgentCountryClients,
  AgentCountryTraffic,
} from "@/lib/types";

export function makeServerSafe(overrides?: Partial<ServerSafe>): ServerSafe {
  return {
    id: "test-uuid-1",
    label: "Test Server",
    server_id: "agent-001",
    created_at: "2025-01-01T00:00:00.000Z",
    last_seen_at: "2025-01-15T12:00:00.000Z",
    first_seen_at: "2025-01-01T00:00:00.000Z",
    tags: ["us-east", "production"],
    ...overrides,
  };
}

export function makeServerRow(overrides?: Partial<ServerRow>): ServerRow {
  return {
    id: "test-uuid-1",
    host: "192.168.1.100",
    port: 8080,
    secret: "mysecret",
    label: "Test Server",
    server_id: "agent-001",
    created_at: "2025-01-01T00:00:00.000Z",
    last_seen_at: "2025-01-15T12:00:00.000Z",
    first_seen_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeAgentStatus(
  overrides?: Partial<AgentStatusResponse>
): AgentStatusResponse {
  return {
    server_id: "agent-001",
    timestamp: Math.floor(Date.now() / 1000),
    total_containers: 2,
    connected_clients: 15,
    connecting_clients: 3,
    system: {
      cpu_percent: 45.2,
      memory_used_mb: 2048,
      memory_total_mb: 8192,
      load_avg_1m: 1.5,
      load_avg_5m: 1.2,
      load_avg_15m: 0.8,
      disk_used_gb: 50,
      disk_total_gb: 200,
      net_in_mbps: 100,
      net_out_mbps: 250,
      net_errors: 0,
      net_drops: 0,
    },
    settings: {
      max_clients: 100,
      bandwidth_limit_mbps: 1000,
      auto_start: true,
      container_count: 2,
    },
    session: {
      start_time: Math.floor(Date.now() / 1000) - 86400,
      peak_connections: 50,
      avg_connections: 25,
      total_upload_bytes: 1073741824,
      total_download_bytes: 536870912,
    },
    connections: {
      total: 18,
      unique_ips: 12,
      states: { ESTABLISHED: 15, SYN_SENT: 3 },
    },
    clients_by_country: [
      { country: "US", connections: 8 },
      { country: "DE", connections: 5 },
      { country: "JP", connections: 2 },
    ],
    containers: [
      {
        id: "container-1",
        name: "conduit-1",
        status: "running",
        cpu_percent: 12.5,
        memory_mb: 256,
        uptime: "24h5m",
        health: null,
        app_metrics: null,
        settings: null,
      },
      {
        id: "container-2",
        name: "conduit-2",
        status: "running",
        cpu_percent: 8.0,
        memory_mb: 128,
        uptime: "12h30m",
        health: null,
        app_metrics: null,
        settings: null,
      },
    ],
    ...overrides,
  };
}

export function makeMetricsDataPoint(
  overrides?: Partial<MetricsDataPoint>
): MetricsDataPoint {
  return {
    timestamp: Math.floor(Date.now() / 1000),
    system_cpu: 45.2,
    system_memory_used: 2048,
    system_memory_total: 8192,
    system_net_in: 100,
    system_net_out: 250,
    total_connections: 18,
    unique_ips: 12,
    container_count: 2,
    total_container_cpu: 20.5,
    total_container_memory: 384,
    clients_by_country: [{ country: "US", connections: 8 }],
    ...overrides,
  };
}

export function makeCountryClients(
  country: string,
  connections: number
): AgentCountryClients {
  return { country, connections };
}

export function makeCountryTraffic(
  country: string,
  from_bytes: number,
  to_bytes: number
): AgentCountryTraffic {
  return { country, from_bytes, to_bytes };
}
