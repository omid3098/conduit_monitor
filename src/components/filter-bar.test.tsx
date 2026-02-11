// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterBar } from "./filter-bar";
import { renderWithProviders } from "@/test/helpers";

vi.mock("@/hooks/use-servers", () => ({
  useTags: vi.fn(() => ({
    data: ["prod", "staging", "us"],
    isLoading: false,
  })),
}));

const defaultProps = {
  filters: { search: "", tags: [], sort: "label" as const, sortDir: "asc" as const },
  onSearchChange: vi.fn(),
  onToggleTag: vi.fn(),
  onClear: vi.fn(),
  hasActiveFilters: false,
};

describe("FilterBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByPlaceholderText("Search servers...")).toBeInTheDocument();
  });

  it("renders tag chips from useTags", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText("prod")).toBeInTheDocument();
    expect(screen.getByText("staging")).toBeInTheDocument();
    expect(screen.getByText("us")).toBeInTheDocument();
  });

  it("calls onSearchChange when typing", () => {
    render(<FilterBar {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText("Search servers..."), {
      target: { value: "test" },
    });
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith("test");
  });

  it("does not show clear button when no active filters", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.queryByText("Clear")).not.toBeInTheDocument();
  });

  it("shows clear button when hasActiveFilters", () => {
    render(<FilterBar {...defaultProps} hasActiveFilters={true} />);
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("calls onClear when clear button is clicked", () => {
    render(<FilterBar {...defaultProps} hasActiveFilters={true} />);
    fireEvent.click(screen.getByText("Clear"));
    expect(defaultProps.onClear).toHaveBeenCalled();
  });
});
