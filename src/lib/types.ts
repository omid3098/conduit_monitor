// === Agent API response types (matching the updated conduit-expose JSON contract) ===

export interface AgentSystemMetrics {
  cpu_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  load_avg_1m: number;
  load_avg_5m: number;
  load_avg_15m: number;
  disk_used_gb: number;
  disk_total_gb: number;
  net_in_mbps: number;
  net_out_mbps: number;
  net_errors: number;
  net_drops: number;
}

export interface AgentSettings {
  max_clients: number;
  bandwidth_limit_mbps: number;
  auto_start: boolean;
}

export interface AgentSession {
  start_time: number;
  peak_connections: number;
  avg_connections: number;
  total_upload_bytes: number;
  total_download_bytes: number;
}

export interface AgentConnections {
  total: number;
  unique_ips: number;
  states: Record<string, number>;
}

export interface AgentCountryClients {
  country: string;
  connections: number;
}

export interface AgentContainerHealth {
  restart_count: number;
  oom_killed: boolean;
  fd_count: number;
  thread_count: number;
}

export interface AgentAppMetrics {
  connected_clients: number;
  connecting_clients: number;
  announcing: number;
  is_live: boolean;
  bytes_uploaded: number;
  bytes_downloaded: number;
  uptime_seconds: number;
  idle_seconds: number;
}

export interface AgentContainerSettings {
  max_clients: number;
  bandwidth_limit_mbps: number;
  auto_start: boolean;
}

export interface AgentContainer {
  id: string;
  name: string;
  status: "running" | "down" | "unhealthy";
  cpu_percent: number;
  memory_mb: number;
  uptime: string;
  health: AgentContainerHealth | null;
  app_metrics: AgentAppMetrics | null;
  settings: AgentContainerSettings | null;
}

export interface AgentStatusResponse {
  server_id: string;
  timestamp: number;
  total_containers: number;
  connected_clients: number;
  connecting_clients: number;
  system: AgentSystemMetrics | null;
  settings: AgentSettings | null;
  session: AgentSession | null;
  connections: AgentConnections | null;
  clients_by_country: AgentCountryClients[];
  containers: AgentContainer[];
}

// === Database row type ===

export interface ServerRow {
  id: string;
  host: string;
  port: number;
  secret: string;
  label: string | null;
  server_id: string | null;
  created_at: string;
}

// === API response types (safe for client — NO secrets, hosts, or ports) ===

export interface ServerSafe {
  id: string;
  label: string | null;
  server_id: string | null;
  created_at: string;
}

export interface ServerStatusResult extends AgentStatusResponse {
  stale: boolean;
}

// === Frontend state ===

export type ServerConnectionState =
  | "online"
  | "offline"
  | "auth_failed"
  | "starting_up"
  | "stale";

// === Metrics history types ===

export interface MetricsDataPoint {
  timestamp: number;
  system_cpu: number;
  system_memory_used: number;
  system_memory_total: number;
  system_net_in: number;
  system_net_out: number;
  total_connections: number;
  unique_ips: number;
  container_count: number;
  total_container_cpu: number;
  total_container_memory: number;
  clients_by_country: AgentCountryClients[];
}

export interface MetricsHistoryResponse {
  server_id: string;
  range: string;
  data_points: number;
  history: MetricsDataPoint[];
}

export interface AggregatedHistoryResponse {
  range: string;
  data_points: number;
  history: MetricsDataPoint[];
}
