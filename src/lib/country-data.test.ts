import { mergeCountryData } from "./country-data";
import { makeCountryClients, makeCountryTraffic } from "@/test/fixtures";

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
