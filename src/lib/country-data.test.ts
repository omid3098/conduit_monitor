import { mergeCountryData, normalizeToAlpha2 } from "./country-data";
import { makeCountryClients, makeCountryTraffic } from "@/test/fixtures";

describe("normalizeToAlpha2", () => {
  it("passes through alpha-2 codes", () => {
    expect(normalizeToAlpha2("IR")).toBe("IR");
    expect(normalizeToAlpha2("US")).toBe("US");
    expect(normalizeToAlpha2("us")).toBe("US");
  });

  it("converts full country names to alpha-2", () => {
    expect(normalizeToAlpha2("United States")).toBe("US");
    expect(normalizeToAlpha2("Russia")).toBe("RU");
    expect(normalizeToAlpha2("Germany")).toBe("DE");
    expect(normalizeToAlpha2("Iran")).toBe("IR");
    expect(normalizeToAlpha2("China")).toBe("CN");
    expect(normalizeToAlpha2("Ukraine")).toBe("UA");
    expect(normalizeToAlpha2("Myanmar")).toBe("MM");
    expect(normalizeToAlpha2("United Kingdom")).toBe("GB");
    expect(normalizeToAlpha2("France")).toBe("FR");
    expect(normalizeToAlpha2("Japan")).toBe("JP");
  });

  it("strips annotations like ' - #FreeIran'", () => {
    expect(normalizeToAlpha2("Iran - #FreeIran")).toBe("IR");
    expect(normalizeToAlpha2("China - test")).toBe("CN");
  });

  it("handles common aliases", () => {
    expect(normalizeToAlpha2("Czech Republic")).toBe("CZ");
    expect(normalizeToAlpha2("Burma")).toBe("MM");
  });
});

describe("mergeCountryData", () => {
  it("returns empty array for empty input", () => {
    expect(mergeCountryData([])).toEqual([]);
  });

  it("merges clients without traffic", () => {
    const clients = [
      makeCountryClients("US", 10),
      makeCountryClients("DE", 5),
    ];
    const result = mergeCountryData(clients);

    expect(result).toHaveLength(2);
    expect(result[0].countryCode).toBe("US");
    expect(result[0].connections).toBe(10);
    expect(result[0].trafficIn).toBeUndefined();
    expect(result[0].trafficOut).toBeUndefined();
  });

  it("merges clients with traffic data", () => {
    const clients = [makeCountryClients("US", 10)];
    const traffic = [makeCountryTraffic("US", 1000, 2000)];
    const result = mergeCountryData(clients, traffic);

    expect(result).toHaveLength(1);
    expect(result[0].countryCode).toBe("US");
    expect(result[0].connections).toBe(10);
    expect(result[0].trafficIn).toBe(1000);
    expect(result[0].trafficOut).toBe(2000);
  });

  it("normalizes full country names to alpha-2 codes", () => {
    const clients = [
      makeCountryClients("Iran - #FreeIran", 100),
      makeCountryClients("United States", 20),
      makeCountryClients("Russia", 10),
    ];
    const result = mergeCountryData(clients);

    expect(result).toHaveLength(3);
    expect(result.find((r) => r.countryCode === "IR")?.connections).toBe(100);
    expect(result.find((r) => r.countryCode === "US")?.connections).toBe(20);
    expect(result.find((r) => r.countryCode === "RU")?.connections).toBe(10);
  });

  it("matches traffic to clients using normalized codes", () => {
    const clients = [makeCountryClients("Iran - #FreeIran", 100)];
    const traffic = [makeCountryTraffic("Iran - #FreeIran", 5000, 8000)];
    const result = mergeCountryData(clients, traffic);

    expect(result[0].countryCode).toBe("IR");
    expect(result[0].trafficIn).toBe(5000);
    expect(result[0].trafficOut).toBe(8000);
  });

  it("ignores traffic for countries not in clients", () => {
    const clients = [makeCountryClients("US", 10)];
    const traffic = [makeCountryTraffic("FR", 500, 600)];
    const result = mergeCountryData(clients, traffic);

    expect(result).toHaveLength(1);
    expect(result[0].countryCode).toBe("US");
    expect(result[0].trafficIn).toBeUndefined();
  });

  it("normalizes country codes to uppercase", () => {
    const clients = [makeCountryClients("us", 10)];
    const traffic = [makeCountryTraffic("US", 1000, 2000)];
    const result = mergeCountryData(clients, traffic);

    expect(result[0].countryCode).toBe("US");
    expect(result[0].trafficIn).toBe(1000);
  });

  it("handles undefined traffic parameter", () => {
    const clients = [makeCountryClients("US", 5)];
    const result = mergeCountryData(clients, undefined);
    expect(result).toHaveLength(1);
    expect(result[0].connections).toBe(5);
  });
});
