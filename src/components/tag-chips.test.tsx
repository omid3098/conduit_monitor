// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { TagChips } from "./tag-chips";

describe("TagChips", () => {
  it("returns null for empty tags", () => {
    const { container } = render(<TagChips tags={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders all tags", () => {
    render(<TagChips tags={["prod", "us", "staging"]} />);
    expect(screen.getByText("prod")).toBeInTheDocument();
    expect(screen.getByText("us")).toBeInTheDocument();
    expect(screen.getByText("staging")).toBeInTheDocument();
  });

  it("calls onClick when a tag is clicked", () => {
    const onClick = vi.fn();
    render(<TagChips tags={["prod"]} onClick={onClick} />);
    fireEvent.click(screen.getByText("prod"));
    expect(onClick).toHaveBeenCalledWith("prod");
  });

  it("calls onRemove when remove icon is clicked", () => {
    const onRemove = vi.fn();
    render(<TagChips tags={["prod"]} onRemove={onRemove} />);
    // The X icon is inside the badge, click it
    const badge = screen.getByText("prod").closest("[class*='badge']") || screen.getByText("prod").parentElement;
    const removeBtn = badge?.querySelector("svg");
    expect(removeBtn).toBeTruthy();
    fireEvent.click(removeBtn!);
    expect(onRemove).toHaveBeenCalledWith("prod");
  });

  it("does not show remove icon when onRemove is not provided", () => {
    render(<TagChips tags={["prod"]} />);
    const badge = screen.getByText("prod").closest("[class*='badge']") || screen.getByText("prod").parentElement;
    const svg = badge?.querySelector("svg");
    expect(svg).toBeNull();
  });

  it("applies active styling when tag is in activeTags", () => {
    render(<TagChips tags={["prod", "staging"]} activeTags={["prod"]} />);
    const prodBadge = screen.getByText("prod").closest("[class*='badge']") || screen.getByText("prod").parentElement;
    // Active tag should have backgroundColor set
    expect(prodBadge).toHaveStyle({ backgroundColor: expect.any(String) });
  });
});
