import db from "@/lib/db";

export interface DowntimeIncident {
  start: number;
  end: number | null;
  duration: number;
}

export interface UptimeResult {
  uptimePercent: number;
  downtimeIncidents: DowntimeIncident[];
}

// Track in-memory last-known state per server to detect transitions
const lastKnownState = new Map<string, "online" | "offline">();

export function initializeState(serverId: string): void {
  if (lastKnownState.has(serverId)) return;

  const row = db
    .prepare(
      "SELECT event_type FROM uptime_events WHERE server_id = ? ORDER BY timestamp DESC LIMIT 1"
    )
    .get(serverId) as { event_type: string } | undefined;

  if (row) {
    lastKnownState.set(serverId, row.event_type as "online" | "offline");
  }
}

export function recordStatusResult(
  serverId: string,
  isOnline: boolean
): void {
  const newState = isOnline ? "online" : "offline";
  const prevState = lastKnownState.get(serverId);

  if (prevState !== newState) {
    const now = Math.floor(Date.now() / 1000);
    db.prepare(
      "INSERT INTO uptime_events (server_id, event_type, timestamp) VALUES (?, ?, ?)"
    ).run(serverId, newState, now);
    lastKnownState.set(serverId, newState);
  }
}

export function computeUptime(
  serverId: string,
  rangeSeconds: number
): UptimeResult {
  const now = Math.floor(Date.now() / 1000);
  const since = now - rangeSeconds;

  const events = db
    .prepare(
      "SELECT event_type, timestamp FROM uptime_events WHERE server_id = ? AND timestamp >= ? ORDER BY timestamp ASC"
    )
    .all(serverId, since) as { event_type: string; timestamp: number }[];

  // Determine initial state from the most recent event before the range
  const priorEvent = db
    .prepare(
      "SELECT event_type FROM uptime_events WHERE server_id = ? AND timestamp < ? ORDER BY timestamp DESC LIMIT 1"
    )
    .get(serverId, since) as { event_type: string } | undefined;

  let currentState: "online" | "offline" = priorEvent
    ? (priorEvent.event_type as "online" | "offline")
    : "offline";

  let onlineTime = 0;
  let lastTimestamp = since;
  const incidents: DowntimeIncident[] = [];
  let incidentStart: number | null =
    currentState === "offline" ? since : null;

  for (const event of events) {
    const duration = event.timestamp - lastTimestamp;

    if (currentState === "online") {
      onlineTime += duration;
    }

    if (event.event_type === "offline" && currentState === "online") {
      incidentStart = event.timestamp;
    } else if (
      event.event_type === "online" &&
      currentState === "offline" &&
      incidentStart !== null
    ) {
      incidents.push({
        start: incidentStart,
        end: event.timestamp,
        duration: event.timestamp - incidentStart,
      });
      incidentStart = null;
    }

    currentState = event.event_type as "online" | "offline";
    lastTimestamp = event.timestamp;
  }

  // Account for time from last event to now
  if (currentState === "online") {
    onlineTime += now - lastTimestamp;
  } else if (incidentStart !== null) {
    incidents.push({
      start: incidentStart,
      end: null,
      duration: now - incidentStart,
    });
  }

  const totalRange = now - since;
  const uptimePercent =
    totalRange > 0 ? (onlineTime / totalRange) * 100 : 0;

  return { uptimePercent, downtimeIncidents: incidents };
}
