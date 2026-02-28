// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { CountryListSidebar } from "./country-list-sidebar";

vi.mock("@/lib/format", () => ({
  formatCountryCode: (code: string) => code.toUpperCase(),
  formatCompact: (num: number) => String(num),
}));

describe("CountryListSidebar", () => {
  it("renders all countries sorted by connections", () => {
    const countries = [
      { country: "us", connections: 100 },
      { country: "ir", connections: 500 },
      { country: "de", connections: 50 },
      { country: "mm", connections: 10 },
    ];
    render(<CountryListSidebar countries={countries} />);

    expect(screen.getByText("IR")).toBeInTheDocument();
    expect(screen.getByText("US")).toBeInTheDocument();
    expect(screen.getByText("DE")).toBeInTheDocument();
    expect(screen.getByText("MM")).toBeInTheDocument();

    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows country count in header", () => {
    const countries = [
      { country: "us", connections: 100 },
      { country: "ir", connections: 500 },
      { country: "de", connections: 50 },
    ];
    render(<CountryListSidebar countries={countries} />);
    expect(screen.getByText("3 countries")).toBeInTheDocument();
  });

  it("shows singular form for one country", () => {
    render(
      <CountryListSidebar countries={[{ country: "us", connections: 42 }]} />
    );
    expect(screen.getByText("1 country")).toBeInTheDocument();
  });

  it("shows empty state when no countries", () => {
    render(<CountryListSidebar countries={[]} />);
    expect(screen.getByText("No country data available")).toBeInTheDocument();
  });

  it("shows percentages for each country", () => {
    const countries = [
      { country: "ir", connections: 750 },
      { country: "us", connections: 250 },
    ];
    render(<CountryListSidebar countries={countries} />);
    expect(screen.getByText("75.0%")).toBeInTheDocument();
    expect(screen.getByText("25.0%")).toBeInTheDocument();
  });
});
