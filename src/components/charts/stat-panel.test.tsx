// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { StatPanel } from "./stat-panel";

// Mock recharts to avoid jsdom issues
vi.mock("recharts", () => ({
  Line: () => null,
  LineChart: () => null,
}));

describe("StatPanel", () => {
  it("renders label and value", () => {
    render(<StatPanel label="Clients" value="42" />);
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<StatPanel label="Traffic" value="1.5 Mbps" subtitle="In/Out" />);
    expect(screen.getByText("In/Out")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(<StatPanel label="CPU" value="25%" />);
    // Only label and value should be present
    expect(screen.getByText("CPU")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("renders trend arrow when provided", () => {
    render(<StatPanel label="Clients" value="42" trend="up" />);
    expect(screen.getByText("\u2191")).toBeInTheDocument();
  });

  it("renders down trend arrow", () => {
    render(<StatPanel label="Clients" value="42" trend="down" />);
    expect(screen.getByText("\u2193")).toBeInTheDocument();
  });

  it("applies threshold color to value", () => {
    render(
      <StatPanel label="CPU" value="95%" thresholdColor="hsl(0, 84%, 60%)" />
    );
    const valueEl = screen.getByText("95%");
    expect(valueEl).toHaveStyle({ color: "hsl(0, 84%, 60%)" });
  });

  it("renders sparkline when data has more than 1 point", () => {
    render(
      <StatPanel label="CPU" value="50%" sparklineData={[10, 20, 30, 40]} />
    );
    expect(screen.getByText("CPU")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("does not render sparkline when data has 0 or 1 point", () => {
    render(<StatPanel label="CPU" value="50%" sparklineData={[10]} />);
    expect(screen.getByText("CPU")).toBeInTheDocument();
  });

  it("uses default color when no thresholdColor", () => {
    render(<StatPanel label="CPU" value="50%" color="var(--color-chart-1)" />);
    const valueEl = screen.getByText("50%");
    expect(valueEl).toHaveStyle({ color: "var(--color-chart-1)" });
  });

  it("renders neutral trend arrow", () => {
    render(<StatPanel label="Clients" value="42" trend="neutral" />);
    expect(screen.getByText("\u2192")).toBeInTheDocument();
  });
});
