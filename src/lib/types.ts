// === Agent API response types (matching the agent's JSON contract) ===

export interface AgentAppMetrics {
  connections: number;
  traffic_in: number;
  traffic_out: number;
}

export interface AgentContainer {
  id: string;
  name: string;
  status: "running" | "down" | "unhealthy";
  cpu_percent: number;
  memory_mb: number;
  uptime: string;
  app_metrics: AgentAppMetrics | null;
}

export interface AgentStatusResponse {
  server_id: string;
  timestamp: number;
  total_containers: number;
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

export interface ServerStatusResult {
  server_id: string;
  timestamp: number;
  total_containers: number;
  containers: AgentContainer[];
  stale: boolean;
}

// === Frontend state ===

export type ServerConnectionState =
  | "online"
  | "offline"
  | "auth_failed"
  | "starting_up"
  | "stale";
