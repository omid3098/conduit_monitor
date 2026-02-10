// Mock conduit-expose agent for testing
// Run: node test-agent.js
// Then add: conduit://testsecret@localhost:9090

const http = require("http");

const SECRET = "testsecret";
const PORT = 9090;

let sessionStart = Math.floor(Date.now() / 1000) - 3600 * 6; // 6 hours ago
let peakConnections = 0;
let pollCount = 0;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makeStatus() {
  pollCount++;
  const now = Math.floor(Date.now() / 1000);
  const connTotal = Math.floor(rand(200, 320));
  if (connTotal > peakConnections) peakConnections = connTotal;
  const uniqueIps = Math.floor(connTotal * rand(0.65, 0.8));

  const c1Connected = Math.floor(rand(80, 160));
  const c2Connected = Math.floor(rand(60, 140));
  const c1Connecting = Math.floor(rand(1, 8));
  const c2Connecting = Math.floor(rand(1, 5));

  const uploadBase = 987654321000 + pollCount * rand(5000000, 15000000);
  const downloadBase = 123456789000 + pollCount * rand(1000000, 5000000);

  return {
    server_id: "test-server-01",
    timestamp: now,
    total_containers: 2,

    system: {
      cpu_percent: rand(40, 98),
      memory_used_mb: rand(500, 700),
      memory_total_mb: 3725,
      load_avg_1m: rand(0.8, 2.5),
      load_avg_5m: rand(0.7, 2.0),
      load_avg_15m: rand(0.5, 1.5),
      disk_used_gb: rand(40, 50),
      disk_total_gb: 100,
      net_in_mbps: rand(50, 90),
      net_out_mbps: rand(60, 80),
      net_errors: Math.random() > 0.9 ? Math.floor(rand(1, 5)) : 0,
      net_drops: 0,
    },

    settings: {
      max_clients: 200,
      bandwidth_limit_mbps: 0,
      auto_start: true,
    },

    session: {
      start_time: sessionStart,
      peak_connections: peakConnections,
      avg_connections: rand(200, 280),
      total_upload_bytes: uploadBase,
      total_download_bytes: downloadBase,
    },

    connections: {
      total: connTotal,
      unique_ips: uniqueIps,
      states: {
        established: Math.floor(connTotal * 0.83),
        time_wait: Math.floor(connTotal * 0.10),
        close_wait: Math.floor(connTotal * 0.03),
        syn_sent: Math.floor(rand(1, 5)),
        syn_recv: Math.floor(rand(1, 5)),
      },
    },

    clients_by_country: [
      { country: "IR", connections: Math.floor(connTotal * rand(0.55, 0.70)) },
      { country: "CN", connections: Math.floor(connTotal * rand(0.10, 0.20)) },
      { country: "RU", connections: Math.floor(connTotal * rand(0.03, 0.08)) },
      { country: "UA", connections: Math.floor(connTotal * rand(0.01, 0.04)) },
      { country: "MM", connections: Math.floor(connTotal * rand(0.005, 0.02)) },
    ],

    containers: [
      {
        id: "a1b2c3d4e5f6",
        name: "conduit",
        status: "running",
        cpu_percent: rand(60, 110),
        memory_mb: rand(130, 160),
        uptime: "54h12m35s",
        health: {
          restart_count: 0,
          oom_killed: false,
          fd_count: Math.floor(rand(140, 170)),
          thread_count: Math.floor(rand(20, 28)),
        },
        app_metrics: {
          connected_clients: c1Connected,
          connecting_clients: c1Connecting,
          announcing: Math.floor(rand(1, 4)),
          is_live: true,
          bytes_uploaded: uploadBase * 0.52,
          bytes_downloaded: downloadBase * 0.48,
          uptime_seconds: now - sessionStart,
          idle_seconds: 0,
        },
        settings: {
          max_clients: 100,
          bandwidth_limit_mbps: 0,
          auto_start: true,
        },
      },
      {
        id: "1d47bdf182be",
        name: "conduit-2",
        status: "running",
        cpu_percent: rand(70, 120),
        memory_mb: rand(130, 160),
        uptime: "54h12m35s",
        health: {
          restart_count: 0,
          oom_killed: false,
          fd_count: Math.floor(rand(130, 160)),
          thread_count: Math.floor(rand(18, 26)),
        },
        app_metrics: {
          connected_clients: c2Connected,
          connecting_clients: c2Connecting,
          announcing: Math.floor(rand(1, 3)),
          is_live: true,
          bytes_uploaded: uploadBase * 0.48,
          bytes_downloaded: downloadBase * 0.52,
          uptime_seconds: now - sessionStart,
          idle_seconds: 0,
        },
        settings: {
          max_clients: 100,
          bandwidth_limit_mbps: 0,
          auto_start: true,
        },
      },
    ],
  };
}

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/health") {
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.url === "/status") {
    if (req.headers["x-conduit-auth"] !== SECRET) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }
    res.end(JSON.stringify(makeStatus()));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => {
  console.log(`Mock conduit-expose agent running on port ${PORT}`);
  console.log(`Add this server: conduit://${SECRET}@localhost:${PORT}`);
});
