import { parseConduitUri } from "./conduit-uri";

describe("parseConduitUri", () => {
  it("parses a valid conduit URI", () => {
    const result = parseConduitUri("conduit://mysecret@host.example.com:8080");
    expect(result).toEqual({
      host: "host.example.com",
      port: 8080,
      secret: "mysecret",
    });
  });

  it("parses a URI with numeric IP", () => {
    const result = parseConduitUri("conduit://abc123@192.168.1.1:9090");
    expect(result).toEqual({
      host: "192.168.1.1",
      port: 9090,
      secret: "abc123",
    });
  });

  it("throws for non-conduit scheme", () => {
    expect(() => parseConduitUri("http://secret@host:8080")).toThrow(
      "URI must start with conduit://"
    );
  });

  it("throws for missing secret", () => {
    expect(() => parseConduitUri("conduit://host.com:8080")).toThrow(
      "Missing secret"
    );
  });

  it("throws for missing port", () => {
    expect(() => parseConduitUri("conduit://secret@host.com")).toThrow(
      "Missing or invalid port"
    );
  });

  it("throws for empty string", () => {
    expect(() => parseConduitUri("")).toThrow("URI must start with conduit://");
  });

  it("parses URI with encoded characters in secret", () => {
    const result = parseConduitUri("conduit://my%40secret@host.com:3000");
    expect(result.host).toBe("host.com");
    expect(result.port).toBe(3000);
  });
});
