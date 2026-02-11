/**
 * Integration test for WorldMap — exercises the REAL data pipeline:
 *   world-110m.json → topojson-client → d3-geo → ISO mapping → fill colors → SVG paths
 *
 * Only react-simple-maps is mocked (it needs browser APIs for zoom).
 * Everything else is real: the actual TopoJSON, topojson-client, d3-geo, and the component logic.
 */
import { render } from "@testing-library/react";
import type { CountryMapData } from "@/lib/country-data";

// Mock only react-simple-maps (needs d3-zoom / d3-selection browser APIs)
vi.mock("react-simple-maps", async () => {
  const React = await import("react");
  return {
    ComposableMap: ({ children, ...props }: any) =>
      React.createElement("svg", { "data-testid": "composable-map", ...props }, children),
    ZoomableGroup: ({ children }: any) =>
      React.createElement("g", { "data-testid": "zoomable-group" }, children),
  };
});

// Import the REAL module — topojson-client, d3-geo, world-110m.json are all real
const { WorldMap, countryPaths } = await vi.importActual<typeof import("./world-map")>(
  "./world-map"
);

// Test data mimicking what the mock conduit-expose agent returns
const AGENT_DATA: CountryMapData[] = [
  { countryCode: "IR", countryName: "Iran", connections: 118 },
  { countryCode: "CN", countryName: "China", connections: 85 },
  { countryCode: "RU", countryName: "Russia", connections: 42 },
  { countryCode: "UA", countryName: "Ukraine", connections: 20 },
  { countryCode: "MM", countryName: "Myanmar", connections: 8 },
];

function getAllPaths(container: HTMLElement) {
  return container.querySelectorAll<SVGPathElement>("g[data-testid='zoomable-group'] path");
}

function findPathByCountryId(container: HTMLElement, numericId: string) {
  const cp = countryPaths.find((p) => p.id === numericId);
  if (!cp) return null;
  const paths = getAllPaths(container);
  return Array.from(paths).find((p) => p.getAttribute("d") === cp.d) ?? null;
}

describe("WorldMap integration (real TopoJSON + d3-geo pipeline)", () => {
  // --- Module-level data pipeline ---

  it("extracts all 177 countries from the real TopoJSON", () => {
    expect(countryPaths.length).toBe(177);
  });

  it("every country has a non-empty SVG path string", () => {
    for (const cp of countryPaths) {
      expect(cp.d).toBeTruthy();
      expect(cp.d.startsWith("M")).toBe(true);
    }
  });

  it("every country has a name", () => {
    for (const cp of countryPaths) {
      expect(cp.name.length).toBeGreaterThan(0);
    }
  });

  it("maps known numeric IDs to expected countries", () => {
    const iran = countryPaths.find((cp) => cp.id === "364");
    const china = countryPaths.find((cp) => cp.id === "156");
    const russia = countryPaths.find((cp) => cp.id === "643");
    const usa = countryPaths.find((cp) => cp.id === "840");

    expect(iran).toBeDefined();
    expect(iran!.name).toMatch(/Iran/i);

    expect(china).toBeDefined();
    expect(china!.name).toMatch(/China/i);

    expect(russia).toBeDefined();
    expect(russia!.name).toMatch(/Russia/i);

    expect(usa).toBeDefined();
    expect(usa!.name).toMatch(/United States/i);
  });

  // --- Rendered component with real data ---

  it("renders 177 path elements from real TopoJSON", () => {
    const { container } = render(<WorldMap data={AGENT_DATA} />);
    const paths = getAllPaths(container);
    expect(paths.length).toBe(177);
  });

  it("Iran (id=364) gets green fill with connection data", () => {
    const { container } = render(<WorldMap data={AGENT_DATA} />);
    const iranPath = findPathByCountryId(container, "364");
    expect(iranPath).not.toBeNull();
    expect(iranPath!.style.fill).toMatch(/^hsl\(142/);
  });

  it("China (id=156) gets green fill with connection data", () => {
    const { container } = render(<WorldMap data={AGENT_DATA} />);
    const chinaPath = findPathByCountryId(container, "156");
    expect(chinaPath).not.toBeNull();
    expect(chinaPath!.style.fill).toMatch(/^hsl\(142/);
  });

  it("Russia (id=643) gets green fill with connection data", () => {
    const { container } = render(<WorldMap data={AGENT_DATA} />);
    const russiaPath = findPathByCountryId(container, "643");
    expect(russiaPath).not.toBeNull();
    expect(russiaPath!.style.fill).toMatch(/^hsl\(142/);
  });

  it("France (id=250, no data) gets muted fill", () => {
    const { container } = render(<WorldMap data={AGENT_DATA} />);
    const francePath = findPathByCountryId(container, "250");
    expect(francePath).not.toBeNull();
    expect(francePath!.style.fill).not.toMatch(/^hsl\(142/);
  });

  it("country with most connections gets the darkest green", () => {
    const { container } = render(<WorldMap data={AGENT_DATA} />);

    // Iran has 118 connections (most), Myanmar has 8 (least)
    const iranPath = findPathByCountryId(container, "364")!;
    const myanmarPath = findPathByCountryId(container, "104")!;

    const getLightness = (fill: string) => {
      const m = fill.match(/hsl\(142,\s*70%,\s*([\d.]+)%\)/);
      return m ? parseFloat(m[1]) : null;
    };

    const iranL = getLightness(iranPath.style.fill);
    const myanmarL = getLightness(myanmarPath.style.fill);

    expect(iranL).not.toBeNull();
    expect(myanmarL).not.toBeNull();
    // Lower lightness = darker = more connections
    expect(iranL!).toBeLessThan(myanmarL!);
  });

  it("all countries get muted fill when data is empty", () => {
    const { container } = render(<WorldMap data={[]} />);
    const paths = getAllPaths(container);

    let greenCount = 0;
    paths.forEach((p) => {
      if (/^hsl\(142/.test(p.style.fill)) greenCount++;
    });
    expect(greenCount).toBe(0);
  });

  it("only countries WITH data get green fill, others stay muted", () => {
    const { container } = render(<WorldMap data={AGENT_DATA} />);
    const paths = getAllPaths(container);

    let greenCount = 0;
    paths.forEach((p) => {
      if (/^hsl\(142/.test(p.style.fill)) greenCount++;
    });

    // Exactly 5 countries should be green (IR, CN, RU, UA, MM)
    expect(greenCount).toBe(AGENT_DATA.length);
  });
});
