// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./status-badge";

describe("StatusBadge", () => {
  it("renders Online for online state", () => {
    render(<StatusBadge state="online" />);
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("renders Offline for offline state", () => {
    render(<StatusBadge state="offline" />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("renders Auth Failed for auth_failed state", () => {
    render(<StatusBadge state="auth_failed" />);
    expect(screen.getByText("Auth Failed")).toBeInTheDocument();
  });

  it("renders Starting Up for starting_up state", () => {
    render(<StatusBadge state="starting_up" />);
    expect(screen.getByText("Starting Up")).toBeInTheDocument();
  });

  it("renders Stale for stale state", () => {
    render(<StatusBadge state="stale" />);
    expect(screen.getByText("Stale")).toBeInTheDocument();
  });

  it("renders Never Connected for never_connected state", () => {
    render(<StatusBadge state="never_connected" />);
    expect(screen.getByText("Never Connected")).toBeInTheDocument();
  });

  it("shows relative time when offline with lastSeenAt", () => {
    const recentDate = new Date(Date.now() - 60_000).toISOString();
    render(<StatusBadge state="offline" lastSeenAt={recentDate} />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
    // Should show relative time like "1m ago"
    expect(screen.getByText(/ago/)).toBeInTheDocument();
  });

  it("does not show relative time for non-offline states", () => {
    const recentDate = new Date(Date.now() - 60_000).toISOString();
    render(<StatusBadge state="online" lastSeenAt={recentDate} />);
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.queryByText(/ago/)).not.toBeInTheDocument();
  });
});
