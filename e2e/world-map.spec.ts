/**
 * E2E test: verifies the world map renders colored countries in a real browser
 * using the REAL servers already configured in the database.
 *
 * Prerequisites:
 *   1. npm run dev                 — Next.js dev server on :3000
 *   2. At least one real conduit-expose server configured with active clients
 *
 * Run: npx playwright test e2e/world-map.spec.ts
 */
import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3000";

/** Count path elements with a green-dominant fill (rgb where G > R and G > B). */
async function countGreenPaths(
  paths: ReturnType<typeof import("@playwright/test").Page.prototype.locator>
) {
  return paths.evaluateAll((els) => {
    let count = 0;
    for (const el of els) {
      const fill = getComputedStyle(el).fill;
      const m = fill.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (m) {
        const [, r, g, b] = m.map(Number);
        if (g > r && g > b) count++;
      }
    }
    return count;
  });
}

test.describe("World Map E2E", () => {
  // Trigger a status poll on all configured servers so fresh country data is available
  test.beforeAll(async ({ request }) => {
    const servers: any[] = await (
      await request.get(`${BASE}/api/servers`)
    ).json();

    expect(servers.length).toBeGreaterThan(0);

    // Poll each server to ensure country data is populated
    await Promise.all(
      servers.map((s) => request.get(`${BASE}/api/servers/${s.id}/status`))
    );

    // Let the polling results propagate
    await new Promise((r) => setTimeout(r, 2000));
  });

  test("world map renders green-filled countries for real server data", async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    // Wait for the SVG map to appear
    const svg = page.locator("svg.rsm-svg");
    await expect(svg).toBeVisible({ timeout: 15_000 });

    // Wait for paths to render
    const paths = svg.locator("path");
    await expect(paths.first()).toBeVisible({ timeout: 10_000 });

    const pathCount = await paths.count();
    expect(pathCount).toBeGreaterThan(100); // world-110m has 177 countries

    // Dump fill breakdown for debugging
    const fillInfo = await paths.evaluateAll((els) => {
      const fills = new Map<string, number>();
      for (const el of els) {
        const fill = getComputedStyle(el).fill;
        fills.set(fill, (fills.get(fill) || 0) + 1);
      }
      return Array.from(fills.entries()).map(([k, v]) => `${v}x ${k}`);
    });
    console.log("Fill value breakdown:");
    for (const line of fillInfo) {
      console.log("  ", line);
    }

    const greenCount = await countGreenPaths(paths);
    console.log(
      `Found ${greenCount} green-filled countries out of ${pathCount} total paths`
    );

    // Real servers have clients from Iran, US, Russia, Germany, etc.
    // At minimum Iran should always be green (it has the most connections)
    expect(greenCount).toBeGreaterThanOrEqual(1);

    // Take a screenshot for visual verification
    await page.screenshot({
      path: "e2e/screenshots/world-map.png",
      fullPage: false,
    });
  });

  test("hovering a country with data shows tooltip with connection count", async ({
    page,
  }) => {
    await page.goto(BASE, { waitUntil: "networkidle" });

    const svg = page.locator("svg.rsm-svg");
    await expect(svg).toBeVisible({ timeout: 15_000 });

    const paths = svg.locator("path");
    await expect(paths.first()).toBeVisible({ timeout: 10_000 });

    // Find a green path (country with data) and hover it
    const pathCount = await paths.count();
    let hovered = false;
    for (let i = 0; i < pathCount; i++) {
      const isGreen = await paths.nth(i).evaluate((el) => {
        const fill = getComputedStyle(el).fill;
        const m = fill.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (m) {
          const [, r, g, b] = m.map(Number);
          return g > r && g > b;
        }
        return false;
      });
      if (isGreen) {
        await paths.nth(i).hover({ force: true });
        hovered = true;
        break;
      }
    }

    expect(hovered).toBe(true);

    // A tooltip should appear with "connections" text
    const tooltip = page.locator("text=connections");
    await expect(tooltip).toBeVisible({ timeout: 5_000 });
  });
});
