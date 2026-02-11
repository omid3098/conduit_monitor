import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "istanbul",
      enabled: true,
      reporter: ["text", "text-summary", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/lib/**/*.ts",
        "src/hooks/**/*.ts",
        "src/app/api/**/*.ts",
        // Only tested components (chart wrappers, world-map, orchestrator views excluded)
        "src/components/status-badge.tsx",
        "src/components/tag-chips.tsx",
        "src/components/tag-editor.tsx",
        "src/components/filter-bar.tsx",
        "src/components/offline-diagnostics.tsx",
        "src/components/add-server-dialog.tsx",
        "src/components/server-list.tsx",
        "src/components/overview/aggregate-stats.tsx",
        "src/components/overview/server-row.tsx",
        "src/components/overview/compact-server-card.tsx",
        "src/components/server-detail/detail-header.tsx",
        "src/components/server-detail/stat-row.tsx",
        "src/components/charts/stat-panel.tsx",
        "src/components/uptime/uptime-bar.tsx",
        "src/components/uptime/uptime-summary.tsx",
      ],
      exclude: [
        "src/lib/types.ts",
        "src/lib/db.ts",
        "src/instrumentation.ts",
      ],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
    setupFiles: ["./src/test/setup.ts"],
  },
});
