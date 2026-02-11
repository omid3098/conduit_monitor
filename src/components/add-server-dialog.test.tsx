// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddServerDialog } from "./add-server-dialog";
import { renderWithProviders } from "@/test/helpers";

const mockMutateAsync = vi.fn();
vi.mock("@/hooks/use-servers", () => ({
  useAddServer: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
  useTags: vi.fn(() => ({ data: [], isLoading: false })),
}));

describe("AddServerDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({});
  });

  it("renders trigger button", () => {
    renderWithProviders(<AddServerDialog />);
    expect(screen.getByText("Add Server")).toBeInTheDocument();
  });

  it("opens dialog on button click", async () => {
    renderWithProviders(<AddServerDialog />);
    fireEvent.click(screen.getByText("Add Server"));
    await waitFor(() => {
      expect(screen.getByText("Add Conduit Server")).toBeInTheDocument();
    });
  });

  it("shows validation error for non-conduit URI", async () => {
    renderWithProviders(<AddServerDialog />);
    fireEvent.click(screen.getByText("Add Server"));

    await waitFor(() => {
      expect(screen.getByLabelText("Conduit URI")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Conduit URI"), {
      target: { value: "http://bad-uri" },
    });
    fireEvent.submit(screen.getByLabelText("Conduit URI").closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("URI must start with conduit://")).toBeInTheDocument();
    });
  });

  it("submits valid form data", async () => {
    renderWithProviders(<AddServerDialog />);
    fireEvent.click(screen.getByText("Add Server"));

    await waitFor(() => {
      expect(screen.getByLabelText("Conduit URI")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Conduit URI"), {
      target: { value: "conduit://secret@host:8080" },
    });
    fireEvent.change(screen.getByLabelText("Label (optional)"), {
      target: { value: "My Server" },
    });
    fireEvent.submit(screen.getByLabelText("Conduit URI").closest("form")!);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        uri: "conduit://secret@host:8080",
        label: "My Server",
        tags: undefined,
      });
    });
  });

  it("shows error from server on mutation failure", async () => {
    mockMutateAsync.mockRejectedValue(new Error("Duplicate server"));
    renderWithProviders(<AddServerDialog />);
    fireEvent.click(screen.getByText("Add Server"));

    await waitFor(() => {
      expect(screen.getByLabelText("Conduit URI")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Conduit URI"), {
      target: { value: "conduit://secret@host:8080" },
    });
    fireEvent.submit(screen.getByLabelText("Conduit URI").closest("form")!);

    await waitFor(() => {
      expect(screen.getByText("Duplicate server")).toBeInTheDocument();
    });
  });
});
