// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { CompactServerCard } from "./compact-server-card";
import { makeServerSafe, makeAgentStatus } from "@/test/fixtures";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement("a", { href, ...props }, children),
}));

const mockUseServerStatus = vi.fn();
vi.mock("@/hooks/use-server-status", () => ({
  useServerStatus: (...args: unknown[]) => mockUseServerStatus(...args),
}));

describe("CompactServerCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders display name from label", () => {
    mockUseServerStatus.mockReturnValue({
      data: makeAgentStatus(),
      connectionState: "online",
      isLoading: false,
    });
    render(<CompactServerCard server={makeServerSafe({ label: "EU-West" })} />);
    expect(screen.getByText("EU-West")).toBeInTheDocument();
  });

  it("shows connected clients count when online", () => {
    const data = makeAgentStatus();
    data.connected_clients = 25;
    mockUseServerStatus.mockReturnValue({
      data,
      connectionState: "online",
      isLoading: false,
    });
    render(<CompactServerCard server={makeServerSafe()} />);
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("connected")).toBeInTheDocument();
  });

  it("shows loading skeleton", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "online",
      isLoading: true,
    });
    const { container } = render(
      <CompactServerCard server={makeServerSafe()} />
    );
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows offline message when down", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "offline",
      isLoading: false,
    });
    render(<CompactServerCard server={makeServerSafe()} />);
    expect(screen.getByText("Unreachable")).toBeInTheDocument();
  });

  it("shows health bars for CPU and RAM", () => {
    const data = makeAgentStatus();
    mockUseServerStatus.mockReturnValue({
      data,
      connectionState: "online",
      isLoading: false,
    });
    render(<CompactServerCard server={makeServerSafe()} />);
    expect(screen.getByText("CPU")).toBeInTheDocument();
    expect(screen.getByText("RAM")).toBeInTheDocument();
  });

  it("links to server detail page", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "online",
      isLoading: false,
    });
    const server = makeServerSafe({ id: "card-id" });
    render(<CompactServerCard server={server} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/servers/card-id");
  });

  it("shows connecting count when > 0", () => {
    const data = makeAgentStatus();
    data.connected_clients = 10;
    data.connecting_clients = 5;
    mockUseServerStatus.mockReturnValue({
      data,
      connectionState: "online",
      isLoading: false,
    });
    render(<CompactServerCard server={makeServerSafe()} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("connecting")).toBeInTheDocument();
  });

  it("shows auth_failed message", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "auth_failed",
      isLoading: false,
    });
    render(<CompactServerCard server={makeServerSafe()} />);
    expect(screen.getByText("Auth failed")).toBeInTheDocument();
  });

  it("shows starting message", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "starting_up",
      isLoading: false,
    });
    render(<CompactServerCard server={makeServerSafe()} />);
    expect(screen.getByText("Starting...")).toBeInTheDocument();
  });

  it("shows never_connected message", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "never_connected",
      isLoading: false,
    });
    render(<CompactServerCard server={makeServerSafe()} />);
    expect(screen.getByText("Never connected")).toBeInTheDocument();
  });

  it("shows max clients when settings.max_clients > 0", () => {
    const data = makeAgentStatus();
    data.settings = { ...data.settings, max_clients: 200 };
    data.connected_clients = 50;
    mockUseServerStatus.mockReturnValue({
      data,
      connectionState: "online",
      isLoading: false,
    });
    render(<CompactServerCard server={makeServerSafe()} />);
    expect(screen.getByText("/200")).toBeInTheDocument();
  });

  it("shows container count and session traffic", () => {
    const data = makeAgentStatus();
    data.total_containers = 3;
    mockUseServerStatus.mockReturnValue({
      data,
      connectionState: "online",
      isLoading: false,
    });
    render(<CompactServerCard server={makeServerSafe()} />);
    expect(screen.getByText("3C")).toBeInTheDocument();
  });

  it("renders stale state as up", () => {
    const data = makeAgentStatus();
    mockUseServerStatus.mockReturnValue({
      data,
      connectionState: "stale",
      isLoading: false,
    });
    render(<CompactServerCard server={makeServerSafe()} />);
    // Stale is treated as "up" - should show client data
    expect(screen.getByText("CPU")).toBeInTheDocument();
    expect(screen.getByText("RAM")).toBeInTheDocument();
  });
});
