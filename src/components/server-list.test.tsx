// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ServerList } from "./server-list";
import { makeServerSafe } from "@/test/fixtures";
import { renderWithProviders } from "@/test/helpers";

const mockServers = [
  makeServerSafe({ id: "s1", label: "Alpha", server_id: "agent-1", tags: ["prod"] }),
  makeServerSafe({ id: "s2", label: "Beta", server_id: "agent-2", tags: ["staging"] }),
];

const { mockUseServers, mockDeleteMutateAsync, mockRenameMutateAsync, mockUpdateTagsMutateAsync } = vi.hoisted(() => {
  const mockDeleteMutateAsync = vi.fn();
  const mockRenameMutateAsync = vi.fn();
  const mockUpdateTagsMutateAsync = vi.fn();
  const mockUseServers = vi.fn();
  return { mockUseServers, mockDeleteMutateAsync, mockRenameMutateAsync, mockUpdateTagsMutateAsync };
});

vi.mock("@/hooks/use-servers", () => ({
  useServers: mockUseServers,
  useDeleteServer: vi.fn(() => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  })),
  useRenameServer: vi.fn(() => ({
    mutateAsync: mockRenameMutateAsync,
    isPending: false,
  })),
  useUpdateServerTags: vi.fn(() => ({
    mutateAsync: mockUpdateTagsMutateAsync,
    isPending: false,
  })),
  useTags: vi.fn(() => ({ data: ["prod", "staging"], isLoading: false })),
}));

vi.mock("@/hooks/use-server-filters", () => ({
  useServerFilters: vi.fn(() => ({
    filters: { search: "", tags: [], sort: "label", sortDir: "asc" },
    setSearch: vi.fn(),
    toggleTag: vi.fn(),
    clearFilters: vi.fn(),
    filterServers: (servers: unknown[]) => servers,
    hasActiveFilters: false,
  })),
}));

describe("ServerList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDeleteMutateAsync.mockResolvedValue({});
    mockRenameMutateAsync.mockResolvedValue({});
    mockUpdateTagsMutateAsync.mockResolvedValue({});
    mockUseServers.mockReturnValue({ data: mockServers, isLoading: false });
  });

  it("renders server labels", () => {
    renderWithProviders(<ServerList />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    renderWithProviders(<ServerList />);
    expect(screen.getByText("Label")).toBeInTheDocument();
    expect(screen.getByText("Tags")).toBeInTheDocument();
    expect(screen.getByText("Server ID")).toBeInTheDocument();
    expect(screen.getByText("Added")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders server IDs", () => {
    renderWithProviders(<ServerList />);
    expect(screen.getByText("agent-1")).toBeInTheDocument();
    expect(screen.getByText("agent-2")).toBeInTheDocument();
  });

  it("shows Remove buttons", () => {
    renderWithProviders(<ServerList />);
    expect(screen.getAllByText("Remove")).toHaveLength(2);
  });

  it("opens confirmation dialog on Remove click", async () => {
    renderWithProviders(<ServerList />);
    fireEvent.click(screen.getAllByText("Remove")[0]);
    await waitFor(() => {
      expect(screen.getByText("Remove Server")).toBeInTheDocument();
      expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
    });
  });

  it("confirms delete and calls mutateAsync", async () => {
    renderWithProviders(<ServerList />);
    fireEvent.click(screen.getAllByText("Remove")[0]);
    await waitFor(() => {
      expect(screen.getByText("Remove Server")).toBeInTheDocument();
    });
    const removeButtons = screen.getAllByRole("button", { name: /Remove/i });
    const dialogRemoveBtn = removeButtons[removeButtons.length - 1];
    fireEvent.click(dialogRemoveBtn);
    await waitFor(() => {
      expect(mockDeleteMutateAsync).toHaveBeenCalledWith("s1");
    });
  });

  it("cancels delete dialog", async () => {
    renderWithProviders(<ServerList />);
    fireEvent.click(screen.getAllByText("Remove")[0]);
    await waitFor(() => {
      expect(screen.getByText("Remove Server")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Cancel"));
    await waitFor(() => {
      expect(screen.queryByText("Remove Server")).not.toBeInTheDocument();
    });
  });

  it("shows loading state", () => {
    mockUseServers.mockReturnValue({ data: undefined, isLoading: true });
    renderWithProviders(<ServerList />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows empty state when no servers", () => {
    mockUseServers.mockReturnValue({ data: [], isLoading: false });
    renderWithProviders(<ServerList />);
    expect(screen.getByText(/No servers added yet/)).toBeInTheDocument();
  });

  it("shows dash for null label in EditableLabel", () => {
    mockUseServers.mockReturnValue({
      data: [makeServerSafe({ id: "s1", label: null, server_id: "agent-1", tags: [] })],
      isLoading: false,
    });
    renderWithProviders(<ServerList />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("clicking label enters edit mode", () => {
    renderWithProviders(<ServerList />);
    fireEvent.click(screen.getByText("Alpha"));
    const input = screen.getByDisplayValue("Alpha");
    expect(input).toBeInTheDocument();
  });

  it("editing label and pressing Enter calls rename", async () => {
    renderWithProviders(<ServerList />);
    fireEvent.click(screen.getByText("Alpha"));
    const input = screen.getByDisplayValue("Alpha");
    fireEvent.change(input, { target: { value: "NewName" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(mockRenameMutateAsync).toHaveBeenCalledWith({ id: "s1", label: "NewName" });
    });
  });

  it("pressing Escape cancels edit", () => {
    renderWithProviders(<ServerList />);
    fireEvent.click(screen.getByText("Alpha"));
    const input = screen.getByDisplayValue("Alpha");
    fireEvent.change(input, { target: { value: "Changed" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("blurring the edit input saves", async () => {
    renderWithProviders(<ServerList />);
    fireEvent.click(screen.getByText("Alpha"));
    const input = screen.getByDisplayValue("Alpha");
    fireEvent.change(input, { target: { value: "Blurred" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(mockRenameMutateAsync).toHaveBeenCalledWith({ id: "s1", label: "Blurred" });
    });
  });

  it("shows + Add tags for servers with no tags", () => {
    mockUseServers.mockReturnValue({
      data: [makeServerSafe({ id: "s1", label: "Test", tags: [] })],
      isLoading: false,
    });
    renderWithProviders(<ServerList />);
    expect(screen.getByText("+ Add tags")).toBeInTheDocument();
  });

  it("clicking tags enters tag edit mode with Done button", () => {
    renderWithProviders(<ServerList />);
    // Click the button wrapper around tags (title="Click to edit tags")
    const editTagsBtn = screen.getAllByTitle("Click to edit tags")[0];
    fireEvent.click(editTagsBtn);
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  it("shows server_id as Unknown when empty", () => {
    mockUseServers.mockReturnValue({
      data: [makeServerSafe({ id: "s1", label: "Test", server_id: "", tags: [] })],
      isLoading: false,
    });
    renderWithProviders(<ServerList />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });
});
