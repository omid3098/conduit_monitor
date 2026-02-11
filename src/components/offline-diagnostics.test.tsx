// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { OfflineDiagnostics } from "./offline-diagnostics";

describe("OfflineDiagnostics", () => {
  it("returns null for online state", () => {
    const { container } = render(
      <OfflineDiagnostics connectionState="online" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("returns null for stale state", () => {
    const { container } = render(
      <OfflineDiagnostics connectionState="stale" />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders offline diagnostics", () => {
    render(<OfflineDiagnostics connectionState="offline" />);
    expect(screen.getByText("Server Offline")).toBeInTheDocument();
    expect(screen.getByText(/conduit-expose agent/)).toBeInTheDocument();
  });

  it("renders auth_failed diagnostics", () => {
    render(<OfflineDiagnostics connectionState="auth_failed" />);
    expect(screen.getByText("Authentication Failed")).toBeInTheDocument();
    expect(screen.getByText(/authentication secret/)).toBeInTheDocument();
  });

  it("renders starting_up diagnostics", () => {
    render(<OfflineDiagnostics connectionState="starting_up" />);
    expect(screen.getByText("Agent Starting Up")).toBeInTheDocument();
    expect(screen.getByText(/collecting initial metrics/)).toBeInTheDocument();
  });

  it("renders never_connected diagnostics", () => {
    render(<OfflineDiagnostics connectionState="never_connected" />);
    expect(screen.getByText("Never Connected")).toBeInTheDocument();
    expect(screen.getByText(/never successfully connected/)).toBeInTheDocument();
  });

  it("shows last seen time when provided", () => {
    const lastSeen = new Date(Date.now() - 300_000).toISOString(); // 5 min ago
    render(
      <OfflineDiagnostics connectionState="offline" lastSeenAt={lastSeen} />
    );
    expect(screen.getByText(/Last seen/)).toBeInTheDocument();
  });

  it("shows diagnostic steps for non-starting_up states", () => {
    render(<OfflineDiagnostics connectionState="offline" />);
    expect(screen.getByText("Diagnostic steps:")).toBeInTheDocument();
  });

  it("does not show diagnostic steps for starting_up", () => {
    render(<OfflineDiagnostics connectionState="starting_up" />);
    expect(screen.queryByText("Diagnostic steps:")).not.toBeInTheDocument();
  });
});
