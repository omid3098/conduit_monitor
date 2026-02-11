// Manually extend the global expect with jest-dom matchers
// (The @testing-library/jest-dom/vitest auto-extend doesn't work with Vitest 4 globals)
import * as matchers from "@testing-library/jest-dom/matchers";

// Use the global expect (injected by Vitest's globals: true)
const g = globalThis as any;
if (g.expect && g.expect.extend) {
  g.expect.extend(matchers);
}

// Polyfill ResizeObserver for Recharts in jsdom
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
