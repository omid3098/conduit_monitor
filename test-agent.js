// Mock conduit-expose agent for testing
// Run: node test-agent.js
// Then add: conduit://testsecret@localhost:9090

const http = require("http");

const SECRET = "testsecret";
const PORT = 9090;

function makeStatus() {
  return {
    server_id: "test-server-01",
    timestamp: Math.floor(Date.now() / 1000),
    total_containers: 3,
    containers: [
      {
        id: "a1b2c3d4e5f6",
        name: "conduit-1",
        status: "running",
        cpu_percent: 45.2 + Math.random() * 10,
        memory_mb: 256.0 + Math.random() * 32,
        uptime: "72h3m12s",
        app_metrics: {
          connections: Math.floor(100 + Math.random() * 80),
          traffic_in: 1073741824 + Math.floor(Math.random() * 10485760),
          traffic_out: 2147483648 + Math.floor(Math.random() * 20971520),
        },
      },
      {
        id: "b2c3d4e5f6a7",
        name: "conduit-2",
        status: "running",
        cpu_percent: 8.2 + Math.random() * 5,
        memory_mb: 128.5 + Math.random() * 16,
        uptime: "24h15m42s",
        app_metrics: {
          connections: Math.floor(30 + Math.random() * 20),
          traffic_in: 536870912 + Math.floor(Math.random() * 5242880),
          traffic_out: 805306368 + Math.floor(Math.random() * 10485760),
        },
      },
      {
        id: "c3d4e5f6a7b8",
        name: "conduit-3",
        status: "running",
        cpu_percent: 2.1 + Math.random() * 3,
        memory_mb: 64.0 + Math.random() * 8,
        uptime: "5m30s",
        app_metrics: null, // metrics pending
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
