import { render } from "@testing-library/react";
import type { CountryMapData } from "@/lib/country-data";

// Fake features that topojson-client.feature() will return
const fakeFeatures = [
  { id: "840", properties: { name: "United States of America" }, type: "Feature", geometry: {} },
  { id: "643", properties: { name: "Russia" }, type: "Feature", geometry: {} },
  { id: "826", properties: { name: "United Kingdom" }, type: "Feature", geometry: {} },
  { id: "250", properties: { name: "France" }, type: "Feature", geometry: {} },
  { id: "356", properties: { name: "India" }, type: "Feature", geometry: {} },
];

// Map feature IDs to simple path strings for assertions
const fakePaths: Record<string, string> = {
  "840": "M0,0", "643": "M1,1", "826": "M2,2", "250": "M3,3", "356": "M4,4",
};

// Mock topojson-client to return our fake features
vi.mock("topojson-client", () => ({
  feature: () => ({ features: fakeFeatures }),
}));

// Mock d3-geo to return our fake path strings
vi.mock("d3-geo", () => {
  const mockProjection: any = () => null;
  mockProjection.scale = () => mockProjection;
  mockProjection.center = () => mockProjection;
  mockProjection.translate = () => mockProjection;

  return {
    geoMercator: () => mockProjection,
    geoPath: () => {
      const gen: any = (f: any) => fakePaths[f.id] || "";
      gen.projection = () => gen;
      return gen;
    },
  };
});

// Mock the large JSON import
vi.mock("../../../public/world-110m.json", () => ({
  default: { objects: { countries: {} } },
}));

// Mock react-simple-maps — only need ComposableMap and ZoomableGroup now
vi.mock("react-simple-maps", async () => {
  const React = await import("react");
  return {
    ComposableMap: ({ children, ...props }: any) =>
      React.createElement("svg", { "data-testid": "composable-map", ...props }, children),
    ZoomableGroup: ({ children }: any) =>
      React.createElement("g", { "data-testid": "zoomable-group" }, children),
  };
});

const { WorldMap } = await vi.importActual<typeof import("./world-map")>("./world-map");

const TEST_DATA: CountryMapData[] = [
  { countryCode: "US", countryName: "United States", connections: 100 },
  { countryCode: "RU", countryName: "Russia", connections: 25 },
  { countryCode: "GB", countryName: "United Kingdom", connections: 10 },
];

function getPaths(container: HTMLElement) {
  return container.querySelectorAll<SVGPathElement>("g[data-testid='zoomable-group'] path");
}

function findPath(paths: NodeListOf<SVGPathElement>, d: string) {
  return Array.from(paths).find((p) => p.getAttribute("d") === d);
}

describe("WorldMap", () => {
  it("renders path elements for each geography", () => {
    const { container } = render(<WorldMap data={TEST_DATA} />);
    const paths = getPaths(container);
    expect(paths.length).toBe(5);
  });

  it("applies green fill to countries WITH data", () => {
    const { container } = render(<WorldMap data={TEST_DATA} />);
    const paths = getPaths(container);

    const usPath = findPath(paths, "M0,0")!;
    const ruPath = findPath(paths, "M1,1")!;
    const gbPath = findPath(paths, "M2,2")!;

    expect(usPath.style.fill).toMatch(/^hsl\(142/);
    expect(ruPath.style.fill).toMatch(/^hsl\(142/);
    expect(gbPath.style.fill).toMatch(/^hsl\(142/);
  });

  it("applies muted fill to countries WITHOUT data", () => {
    const { container } = render(<WorldMap data={TEST_DATA} />);
    const paths = getPaths(container);

    const frPath = findPath(paths, "M3,3")!;
    const inPath = findPath(paths, "M4,4")!;

    expect(frPath.style.fill).not.toMatch(/^hsl\(142/);
    expect(inPath.style.fill).not.toMatch(/^hsl\(142/);
  });

  it("applies muted fill to ALL countries when data is empty", () => {
    const { container } = render(<WorldMap data={[]} />);
    const paths = getPaths(container);

    paths.forEach((p) => {
      expect(p.style.fill).not.toMatch(/^hsl\(142/);
    });
  });

  it("countries with more connections get darker green", () => {
    const { container } = render(<WorldMap data={TEST_DATA} />);
    const paths = getPaths(container);

    const usPath = findPath(paths, "M0,0")!;
    const gbPath = findPath(paths, "M2,2")!;

    const getLightness = (fill: string) => {
      const match = fill.match(/hsl\(142,\s*70%,\s*([\d.]+)%\)/);
      return match ? parseFloat(match[1]) : null;
    };

    const usLight = getLightness(usPath.style.fill);
    const gbLight = getLightness(gbPath.style.fill);

    expect(usLight).not.toBeNull();
    expect(gbLight).not.toBeNull();
    expect(usLight!).toBeLessThan(gbLight!);
  });
});
