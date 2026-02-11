// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { ServerRow } from "./server-row";
import { makeServerSafe, makeAgentStatus } from "@/test/fixtures";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    React.createElement("a", { href, ...props }, children),
}));

const mockUseServerStatus = vi.fn();
vi.mock("@/hooks/use-server-status", () => ({
  useServerStatus: (...args: unknown[]) => mockUseServerStatus(...args),
}));

describe("ServerRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders server name with label", () => {
    mockUseServerStatus.mockReturnValue({
      data: makeAgentStatus(),
      connectionState: "online",
      isLoading: false,
    });
    const server = makeServerSafe({ label: "US East" });
    render(<ServerRow server={server} />);
    expect(screen.getByText("US East")).toBeInTheDocument();
  });

  it("falls back to server_id when no label", () => {
    mockUseServerStatus.mockReturnValue({
      data: makeAgentStatus(),
      connectionState: "online",
      isLoading: false,
    });
    const server = makeServerSafe({ label: null, server_id: "agent-42" });
    render(<ServerRow server={server} />);
    expect(screen.getByText("agent-42")).toBeInTheDocument();
  });

  it("falls back to truncated id when no label or server_id", () => {
    mockUseServerStatus.mockReturnValue({
      data: makeAgentStatus(),
      connectionState: "online",
      isLoading: false,
    });
    const server = makeServerSafe({ label: null, server_id: null, id: "abcdef1234567890" });
    render(<ServerRow server={server} />);
    expect(screen.getByText("abcdef12")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "online",
      isLoading: true,
    });
    const server = makeServerSafe();
    const { container } = render(<ServerRow server={server} />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("shows status badge", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "offline",
      isLoading: false,
    });
    const server = makeServerSafe();
    render(<ServerRow server={server} />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("renders offline message when no data and offline", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "offline",
      isLoading: false,
    });
    const server = makeServerSafe();
    render(<ServerRow server={server} />);
    expect(screen.getByText("Server unreachable")).toBeInTheDocument();
  });

  it("renders auth failed message", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "auth_failed",
      isLoading: false,
    });
    const server = makeServerSafe();
    render(<ServerRow server={server} />);
    expect(screen.getByText("Authentication failed")).toBeInTheDocument();
  });

  it("renders starting_up message", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "starting_up",
      isLoading: false,
    });
    const server = makeServerSafe();
    render(<ServerRow server={server} />);
    expect(screen.getByText("Starting up...")).toBeInTheDocument();
  });

  it("renders never_connected message", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "never_connected",
      isLoading: false,
    });
    const server = makeServerSafe();
    render(<ServerRow server={server} />);
    expect(screen.getByText("Never connected")).toBeInTheDocument();
  });

  it("renders client metrics when online with data", () => {
    const data = makeAgentStatus();
    data.connected_clients = 15;
    data.connecting_clients = 3;
    mockUseServerStatus.mockReturnValue({
      data,
      connectionState: "online",
      isLoading: false,
    });
    const server = makeServerSafe();
    render(<ServerRow server={server} />);
    expect(screen.getByText("18")).toBeInTheDocument(); // 15+3
    expect(screen.getByText("Clients")).toBeInTheDocument();
  });

  it("renders traffic section", () => {
    const data = makeAgentStatus();
    mockUseServerStatus.mockReturnValue({
      data,
      connectionState: "online",
      isLoading: false,
    });
    const server = makeServerSafe();
    render(<ServerRow server={server} />);
    expect(screen.getByText("Traffic")).toBeInTheDocument();
  });

  it("renders CPU and RAM gauges", () => {
    const data = makeAgentStatus();
    mockUseServerStatus.mockReturnValue({
      data,
      connectionState: "online",
      isLoading: false,
    });
    const server = makeServerSafe();
    render(<ServerRow server={server} />);
    expect(screen.getByText("CPU")).toBeInTheDocument();
    expect(screen.getByText("RAM")).toBeInTheDocument();
  });

  it("renders countries section", () => {
    const data = makeAgentStatus();
    data.clients_by_country = [
      { country: "US", connections: 8 },
      { country: "DE", connections: 5 },
    ];
    mockUseServerStatus.mockReturnValue({
      data,
      connectionState: "online",
      isLoading: false,
    });
    const server = makeServerSafe();
    render(<ServerRow server={server} />);
    expect(screen.getByText("Countries")).toBeInTheDocument();
    expect(screen.getByText("US")).toBeInTheDocument();
    expect(screen.getByText("DE")).toBeInTheDocument();
  });

  it("shows No data for empty countries", () => {
    const data = makeAgentStatus();
    data.clients_by_country = [];
    mockUseServerStatus.mockReturnValue({
      data,
      connectionState: "online",
      isLoading: false,
    });
    const server = makeServerSafe();
    render(<ServerRow server={server} />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders session total bytes when session data present", () => {
    const data = makeAgentStatus();
    data.session = {
      ...data.session!,
      total_upload_bytes: 1073741824,
      total_download_bytes: 536870912,
    };
    mockUseServerStatus.mockReturnValue({
      data,
      connectionState: "online",
      isLoading: false,
    });
    const server = makeServerSafe();
    render(<ServerRow server={server} />);
    expect(screen.getByText(/total/)).toBeInTheDocument();
  });

  it("dims metrics when connection is down", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "offline",
      isLoading: false,
    });
    const server = makeServerSafe();
    const { container } = render(<ServerRow server={server} />);
    expect(container.querySelector(".opacity-40")).toBeInTheDocument();
  });

  it("links to server detail page", () => {
    mockUseServerStatus.mockReturnValue({
      data: undefined,
      connectionState: "online",
      isLoading: false,
    });
    const server = makeServerSafe({ id: "test-id-123" });
    render(<ServerRow server={server} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/servers/test-id-123");
  });
});
