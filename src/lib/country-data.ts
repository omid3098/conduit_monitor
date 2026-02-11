import type { AgentCountryClients, AgentCountryTraffic } from "@/lib/types";
import { formatCountryCode } from "@/lib/format";

export interface CountryMapData {
  countryCode: string;
  countryName: string;
  connections: number;
  trafficIn?: number;
  trafficOut?: number;
}

// Build a reverse lookup: English country name → ISO alpha-2 code.
// Uses Intl.DisplayNames to enumerate all valid 2-letter region codes.
const NAME_TO_ALPHA2 = new Map<string, string>();

// Deprecated/obsolete ISO 3166-1 codes that collide with current ones in Intl.DisplayNames
const DEPRECATED_CODES = new Set([
  "AN", // Netherlands Antilles
  "BU", // Burma (now MM)
  "CS", // Czechoslovakia / Serbia & Montenegro
  "DD", // East Germany (now DE)
  "FX", // Metropolitan France (now FR)
  "NT", // Neutral Zone
  "SU", // Soviet Union (now RU)
  "TP", // East Timor (now TL)
  "UK", // Non-standard for GB
  "YU", // Yugoslavia
  "ZR", // Zaire (now CD)
]);

try {
  const dn = new Intl.DisplayNames(["en"], { type: "region" });
  for (let i = 65; i <= 90; i++) {
    for (let j = 65; j <= 90; j++) {
      const code = String.fromCharCode(i) + String.fromCharCode(j);
      if (DEPRECATED_CODES.has(code)) continue;
      try {
        const name = dn.of(code);
        if (name && name !== code) {
          const upper = name.toUpperCase();
          NAME_TO_ALPHA2.set(upper, code);
          // Also index the name without parenthetical suffixes:
          // e.g. "Myanmar (Burma)" → also index "Myanmar"
          const withoutParen = upper.replace(/\s*\(.*\)\s*$/, "").trim();
          if (withoutParen !== upper) {
            NAME_TO_ALPHA2.set(withoutParen, code);
          }
        }
      } catch { /* invalid region code */ }
    }
  }
} catch { /* Intl not available */ }

// Common aliases that Intl.DisplayNames may not cover
const ALIASES: Record<string, string> = {
  "CZECH REPUBLIC": "CZ",
  "IVORY COAST": "CI",
  "DEMOCRATIC REPUBLIC OF THE CONGO": "CD",
  "REPUBLIC OF THE CONGO": "CG",
  "SOUTH KOREA": "KR",
  "NORTH KOREA": "KP",
  "MYANMAR (BURMA)": "MM",
  "PALESTINE": "PS",
  "EAST TIMOR": "TL",
  "ESWATINI": "SZ",
  "SWAZILAND": "SZ",
  "CAPE VERDE": "CV",
  "BURMA": "MM",
};
for (const [name, code] of Object.entries(ALIASES)) {
  NAME_TO_ALPHA2.set(name, code);
}

/**
 * Normalize a country string to an ISO alpha-2 code.
 * Handles:
 *  - Already alpha-2: "IR" → "IR"
 *  - Full names: "United States" → "US"
 *  - Annotated names from Conduit Manager: "Iran - #FreeIran" → "IR"
 */
export function normalizeToAlpha2(country: string): string {
  const trimmed = country.trim();

  // Already an alpha-2 code?
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Strip annotations like " - #FreeIran"
  const baseName = trimmed.split(" - ")[0].trim().toUpperCase();

  return NAME_TO_ALPHA2.get(baseName) || baseName;
}

export function mergeCountryData(
  clients: AgentCountryClients[],
  traffic?: AgentCountryTraffic[]
): CountryMapData[] {
  const map = new Map<string, CountryMapData>();

  for (const c of clients) {
    const code = normalizeToAlpha2(c.country);
    map.set(code, {
      countryCode: code,
      countryName: formatCountryCode(code),
      connections: c.connections,
    });
  }

  if (traffic) {
    for (const t of traffic) {
      const code = normalizeToAlpha2(t.country);
      const existing = map.get(code);
      if (existing) {
        existing.trafficIn = t.from_bytes;
        existing.trafficOut = t.to_bytes;
      }
    }
  }

  return Array.from(map.values());
}
