// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { DetailHeader } from "./detail-header";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement("a", { href, ...props }, children),
}));

describe("DetailHeader", () => {
  it("renders server name and status badge", () => {
    render(
      <DetailHeader
        serverName="My Server"
        connectionState="online"
      />
    );
    expect(screen.getByText("My Server")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("renders server ID when provided", () => {
    render(
      <DetailHeader
        serverName="My Server"
        serverId="agent-123"
        connectionState="online"
      />
    );
    expect(screen.getByText("agent-123")).toBeInTheDocument();
  });

  it("shows session uptime when provided and > 0", () => {
    render(
      <DetailHeader
        serverName="My Server"
        connectionState="online"
        sessionUptime={3661}
      />
    );
    expect(screen.getByText(/Session uptime/)).toBeInTheDocument();
  });

  it("does not show session uptime when 0", () => {
    render(
      <DetailHeader
        serverName="My Server"
        connectionState="online"
        sessionUptime={0}
      />
    );
    expect(screen.queryByText(/Session uptime/)).not.toBeInTheDocument();
  });

  it("has back link to dashboard", () => {
    render(
      <DetailHeader
        serverName="My Server"
        connectionState="online"
      />
    );
    expect(screen.getByLabelText("Back to dashboard")).toHaveAttribute("href", "/");
  });

  it("shows lastSeenAt on status badge when offline", () => {
    const lastSeen = new Date(Date.now() - 120_000).toISOString();
    render(
      <DetailHeader
        serverName="My Server"
        connectionState="offline"
        lastSeenAt={lastSeen}
      />
    );
    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });
});
