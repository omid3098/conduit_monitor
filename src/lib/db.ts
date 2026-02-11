import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "conduit_monitor.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    secret TEXT NOT NULL,
    label TEXT,
    server_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(host, port)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS metrics_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    data_json TEXT NOT NULL,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_metrics_server_time
    ON metrics_history (server_id, timestamp)
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS uptime_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('online', 'offline')),
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_uptime_events_server_time
    ON uptime_events (server_id, timestamp)
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS server_tags (
    server_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    PRIMARY KEY (server_id, tag),
    FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_server_tags_tag
    ON server_tags (tag)
`);

// Safe column additions (SQLite lacks ADD COLUMN IF NOT EXISTS)
try {
  db.exec("ALTER TABLE servers ADD COLUMN last_seen_at TEXT");
} catch { /* column already exists */ }
try {
  db.exec("ALTER TABLE servers ADD COLUMN first_seen_at TEXT");
} catch { /* column already exists */ }

export default db;
