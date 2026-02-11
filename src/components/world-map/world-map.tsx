"use client";

import { memo, useState, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import type { CountryMapData } from "@/lib/country-data";
import { formatBytes, formatCompact } from "@/lib/format";

const GEO_URL = "/world-110m.json";

interface WorldMapProps {
  data: CountryMapData[];
  className?: string;
}

interface TooltipState {
  content: string;
  x: number;
  y: number;
}

function getColor(
  countryCode: string,
  dataMap: Map<string, CountryMapData>,
  maxConnections: number
): string {
  const item = dataMap.get(countryCode);
  if (!item || item.connections === 0) return "var(--color-muted, hsl(240, 5%, 90%))";
  const intensity =
    Math.log(item.connections + 1) / Math.log(maxConnections + 1);
  // Interpolate from light green to saturated green
  const lightness = 85 - intensity * 50;
  return `hsl(142, 70%, ${lightness}%)`;
}

function WorldMapInner({ data, className }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [zoom, setZoom] = useState(1);

  const dataMap = new Map(data.map((d) => [d.countryCode, d]));
  const maxConnections = Math.max(...data.map((d) => d.connections), 1);

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.5, 8)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.5, 1)), []);
  const handleReset = useCallback(() => setZoom(1), []);

  const handleMouseEnter = useCallback(
    (geo: { properties: { NAME: string; ISO_A2: string } }, evt: React.MouseEvent) => {
      const code = geo.properties.ISO_A2;
      const item = dataMap.get(code);
      const name = geo.properties.NAME;

      let content = name;
      if (item && item.connections > 0) {
        content = `${name}: ${formatCompact(item.connections)} connections`;
        if (item.trafficIn || item.trafficOut) {
          content += ` | ↑${formatBytes(item.trafficOut ?? 0)} ↓${formatBytes(item.trafficIn ?? 0)}`;
        }
      }

      setTooltip({
        content,
        x: evt.clientX,
        y: evt.clientY,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <div className={`relative ${className ?? ""}`}>
      <ComposableMap
        width={800}
        height={380}
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
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const code = geo.properties.ISO_A2;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getColor(code, dataMap, maxConnections)}
                    stroke="var(--color-border, hsl(240, 6%, 80%))"
                    strokeWidth={0.4}
                    style={{
                      default: { outline: "none", cursor: "grab" },
                      hover: { outline: "none", opacity: 0.8, cursor: "grab" },
                      pressed: { outline: "none", cursor: "grabbing" },
                    }}
                    onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                    onMouseLeave={handleMouseLeave}
                  />
                );
              })
            }
          </Geographies>
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
