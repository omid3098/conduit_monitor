export interface ParsedConduitUri {
  host: string;
  port: number;
  secret: string;
}

export function parseConduitUri(uri: string): ParsedConduitUri {
  if (!uri.startsWith("conduit://")) {
    throw new Error("URI must start with conduit://");
  }

  const httpUrl = uri.replace(/^conduit:\/\//, "http://");
  const parsed = new URL(httpUrl);

  const secret = parsed.username;
  const host = parsed.hostname;
  const port = parseInt(parsed.port, 10);

  if (!secret) {
    throw new Error("Missing secret in conduit:// URI");
  }
  if (!host) {
    throw new Error("Missing host in conduit:// URI");
  }
  if (!port || isNaN(port)) {
    throw new Error("Missing or invalid port in conduit:// URI");
  }

  return { host, port, secret };
}
