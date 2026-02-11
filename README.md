# Conduit Monitor

A real-time monitoring dashboard for [Psiphon Conduit](https://github.com/Psiphon-Inc/conduit) servers. Track connections, traffic, system resources, uptime, and geographic distribution across your fleet — all from a single web UI.

<img width="1529" height="927" alt="Fleet overview dashboard" src="https://github.com/user-attachments/assets/46b24e9c-4cd5-47c6-a9a9-f804451e7170" />
<img width="1538" height="935" alt="Server detail view" src="https://github.com/user-attachments/assets/8ec34d29-f03c-4869-a370-a0090d6ef3ea" />
<img width="1564" height="410" alt="Uptime and metrics" src="https://github.com/user-attachments/assets/6832ab7e-9744-4cc5-979f-a2b3ff34e3c8" />

## Features

- **Fleet overview** — aggregate stats, world map, and at-a-glance health for all servers
- **Server detail** — time-series charts for CPU, memory, traffic, and connections
- **Uptime tracking** — uptime bars, downtime timeline, and availability percentages
- **Container metrics** — per-container CPU, memory, file descriptors, and thread counts
- **Tag-based filtering** — organize and filter servers with custom tags
- **No cloud dependency** — everything runs locally with SQLite; no external database needed

## Prerequisites

Conduit Monitor is designed to work with servers managed by [conduit-manager](https://github.com/SamNet-dev/conduit-manager) — a tool for deploying and managing multiple Psiphon Conduit containers on a single server. You'll need conduit-manager running on your servers first, then install [conduit-expose](https://github.com/omid3098/conduit_expose) to collect metrics from those containers and feed them into this dashboard.

## Quick Start

```bash
git clone https://github.com/omid3098/conduit_monitor.git
cd conduit_monitor
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Adding a Server

Adding a server takes about 30 seconds. You just need a **connection URI** from [conduit-expose](https://github.com/omid3098/conduit_expose) — a lightweight agent that runs on your server and exposes metrics over HTTP.

### 1. Install conduit-expose on your server

```bash
curl -sL https://raw.githubusercontent.com/omid3098/conduit_expose/main/install.sh | sudo bash
```

At the end of installation, you'll get a connection URI:

```
conduit://a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4@203.0.113.42:44626
```

### 2. Add it to the dashboard

1. Open the dashboard and click **"Add Server"**
2. Paste the connection URI
3. Give it a name (e.g. "Frankfurt Node 1")
4. Click **Save**

That's it — the dashboard starts polling immediately and you'll see live metrics within seconds.

### Try it locally with fake data

Don't have a server yet? You can try the dashboard instantly using the built-in mock agent:

```bash
# Terminal 1 — start the mock agent
node test-agent.js

# Terminal 2 — start the dashboard
npm run dev
```

Then add this URI in the dashboard:

```
conduit://testsecret@localhost:9090
```

The mock agent generates realistic fake data (connections, traffic, CPU, memory, country distribution) so you can explore the full dashboard without any real infrastructure.

## Tech Stack

- **Next.js 15** with App Router and Turbopack
- **SQLite** (better-sqlite3) for metrics history and uptime events
- **React Query** for real-time polling
- **Recharts** for time-series charts
- **react-simple-maps** for the world map
- **shadcn/ui** + Tailwind CSS v4 for the UI

## Development

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm test             # Run tests
npm run test:coverage # Coverage report
npm run lint         # ESLint
```

## License

MIT
