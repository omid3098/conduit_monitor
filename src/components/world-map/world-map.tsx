"use client";

import { memo, useState, useMemo } from "react";
import { ComposableMap, ZoomableGroup } from "react-simple-maps";
import { feature } from "topojson-client";
import { geoPath, geoMercator } from "d3-geo";
import type { CountryMapData } from "@/lib/country-data";
import { formatBytes, formatCompact } from "@/lib/format";
import topoData from "../../../public/world-110m.json";

// ISO 3166-1 numeric → alpha-2 mapping for the world-110m TopoJSON
// (which only has numeric IDs, not alpha-2 codes in properties)
const ISO_NUMERIC_TO_ALPHA2: Record<string, string> = {
  "004": "AF", "008": "AL", "010": "AQ", "012": "DZ", "016": "AS",
  "020": "AD", "024": "AO", "028": "AG", "031": "AZ", "032": "AR",
  "036": "AU", "040": "AT", "044": "BS", "048": "BH", "050": "BD",
  "051": "AM", "052": "BB", "056": "BE", "060": "BM", "064": "BT",
  "068": "BO", "070": "BA", "072": "BW", "076": "BR", "084": "BZ",
  "086": "IO", "090": "SB", "092": "VG", "096": "BN", "100": "BG",
  "104": "MM", "108": "BI", "112": "BY", "116": "KH", "120": "CM",
  "124": "CA", "132": "CV", "136": "KY", "140": "CF", "144": "LK",
  "148": "TD", "152": "CL", "156": "CN", "158": "TW", "162": "CX",
  "166": "CC", "170": "CO", "174": "KM", "175": "YT", "178": "CG",
  "180": "CD", "184": "CK", "188": "CR", "191": "HR", "192": "CU",
  "196": "CY", "203": "CZ", "204": "BJ", "208": "DK", "212": "DM",
  "214": "DO", "218": "EC", "222": "SV", "226": "GQ", "231": "ET",
  "232": "ER", "233": "EE", "234": "FO", "238": "FK", "242": "FJ",
  "246": "FI", "248": "AX", "250": "FR", "254": "GF", "258": "PF",
  "260": "TF", "262": "DJ", "266": "GA", "268": "GE", "270": "GM",
  "275": "PS", "276": "DE", "288": "GH", "292": "GI", "296": "KI",
  "300": "GR", "304": "GL", "308": "GD", "312": "GP", "316": "GU",
  "320": "GT", "324": "GN", "328": "GY", "332": "HT", "336": "VA",
  "340": "HN", "344": "HK", "348": "HU", "352": "IS", "356": "IN",
  "360": "ID", "364": "IR", "368": "IQ", "372": "IE", "376": "IL",
  "380": "IT", "384": "CI", "388": "JM", "392": "JP", "398": "KZ",
  "400": "JO", "404": "KE", "408": "KP", "410": "KR", "414": "KW",
  "417": "KG", "418": "LA", "422": "LB", "426": "LS", "428": "LV",
  "430": "LR", "434": "LY", "438": "LI", "440": "LT", "442": "LU",
  "446": "MO", "450": "MG", "454": "MW", "458": "MY", "462": "MV",
  "466": "ML", "470": "MT", "474": "MQ", "478": "MR", "480": "MU",
  "484": "MX", "492": "MC", "496": "MN", "498": "MD", "499": "ME",
  "500": "MS", "504": "MA", "508": "MZ", "512": "OM", "516": "NA",
  "520": "NR", "524": "NP", "528": "NL", "530": "AN", "533": "AW",
  "540": "NC", "548": "VU", "554": "NZ", "558": "NI", "562": "NE",
  "566": "NG", "570": "NU", "574": "NF", "578": "NO", "580": "MP",
  "583": "FM", "584": "MH", "585": "PW", "586": "PK", "591": "PA",
  "598": "PG", "600": "PY", "604": "PE", "608": "PH", "612": "PN",
  "616": "PL", "620": "PT", "624": "GW", "626": "TL", "630": "PR",
  "634": "QA", "638": "RE", "642": "RO", "643": "RU", "646": "RW",
  "652": "BL", "654": "SH", "659": "KN", "660": "AI", "662": "LC",
  "663": "MF", "666": "PM", "670": "VC", "674": "SM", "678": "ST",
  "682": "SA", "686": "SN", "688": "RS", "690": "SC", "694": "SL",
  "702": "SG", "703": "SK", "704": "VN", "705": "SI", "706": "SO",
  "710": "ZA", "716": "ZW", "724": "ES", "728": "SS", "729": "SD",
  "732": "EH", "740": "SR", "744": "SJ", "748": "SZ", "752": "SE",
  "756": "CH", "760": "SY", "762": "TJ", "764": "TH", "768": "TG",
  "772": "TK", "776": "TO", "780": "TT", "784": "AE", "788": "TN",
  "792": "TR", "795": "TM", "796": "TC", "798": "TV", "800": "UG",
  "804": "UA", "807": "MK", "818": "EG", "826": "GB", "831": "GG",
  "832": "JE", "833": "IM", "834": "TZ", "840": "US", "850": "VI",
  "854": "BF", "858": "UY", "860": "UZ", "862": "VE", "876": "WF",
  "882": "WS", "887": "YE", "894": "ZM",
};

interface WorldMapProps {
  data: CountryMapData[];
  className?: string;
}

interface TooltipState {
  content: string;
  x: number;
  y: number;
}

const MAP_WIDTH = 800;
const MAP_HEIGHT = 380;

// Extract GeoJSON features from TopoJSON at module level (synchronous, no effects)
const topo = topoData as any;
const geoFeatures = (feature(topo, topo.objects.countries) as any).features as any[];

// Create projection matching ComposableMap's configuration
const proj = geoMercator()
  .scale(120)
  .center([0, -10] as [number, number])
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

const pathGen = geoPath().projection(proj);

// Pre-compute SVG path strings — done once at import time
export const countryPaths = geoFeatures.map((f, i) => ({
  id: String(f.id),
  d: pathGen(f as any) || "",
  name: (f.properties?.name as string) || "",
  key: `geo-${i}`,
}));

function getColor(
  countryCode: string,
  dataMap: Map<string, CountryMapData>,
  maxConnections: number
): string {
  const item = dataMap.get(countryCode);
  if (!item || item.connections === 0) return "var(--color-muted, hsl(240, 5%, 90%))";
  const intensity =
    Math.log(item.connections + 1) / Math.log(maxConnections + 1);
  const lightness = 85 - intensity * 50;
  return `hsl(142, 70%, ${lightness}%)`;
}

function WorldMapInner({ data, className }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [zoom, setZoom] = useState(1);

  const dataMap = useMemo(
    () => new Map(data.map((d) => [d.countryCode, d])),
    [data]
  );
  const maxConnections = useMemo(
    () => Math.max(...data.map((d) => d.connections), 1),
    [data]
  );

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.5, 8));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.5, 1));
  const handleReset = () => setZoom(1);

  return (
    <div className={`relative ${className ?? ""}`}>
      <ComposableMap
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        projection="geoMercator"
        projectionConfig={{
          scale: 120,
          center: [0, -10],
        }}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup
          zoom={zoom}
          onMoveEnd={({ zoom: z }) => setZoom(z)}
          minZoom={1}
          maxZoom={8}
        >
          {countryPaths.map((cp) => {
            const code = ISO_NUMERIC_TO_ALPHA2[cp.id] || "";
            const fill = getColor(code, dataMap, maxConnections);
            return (
              <path
                key={cp.key}
                d={cp.d}
                style={{ fill, outline: "none", cursor: "grab" }}
                stroke="var(--color-border, hsl(240, 6%, 80%))"
                strokeWidth={0.4}
                onMouseEnter={(evt) => {
                  const item = dataMap.get(code);
                  let content = cp.name;
                  if (item && item.connections > 0) {
                    content = `${cp.name}: ${formatCompact(item.connections)} connections`;
                    if (item.trafficIn || item.trafficOut) {
                      content += ` | ↑${formatBytes(item.trafficOut ?? 0)} ↓${formatBytes(item.trafficIn ?? 0)}`;
                    }
                  }
                  setTooltip({ content, x: evt.clientX, y: evt.clientY });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom controls */}
      <div className="absolute top-1 right-1 flex flex-col gap-0.5">
        <button
          onClick={handleZoomIn}
          className="w-6 h-6 rounded bg-background/80 border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-6 h-6 rounded bg-background/80 border border-border text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center"
          title="Zoom out"
        >
          −
        </button>
        {zoom > 1 && (
          <button
            onClick={handleReset}
            className="w-6 h-6 rounded bg-background/80 border border-border text-[10px] font-medium hover:bg-muted transition-colors flex items-center justify-center"
            title="Reset zoom"
          >
            ↺
          </button>
        )}
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-popover text-popover-foreground border rounded-md shadow-md px-3 py-1.5 text-xs"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 8,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}

export const WorldMap = memo(WorldMapInner);
