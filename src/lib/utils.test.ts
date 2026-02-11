import { cn } from "./utils";

describe("cn", () => {
  it("combines class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar")).toBe("foo");
    expect(cn("foo", true && "bar")).toBe("foo bar");
  });

  it("merges tailwind classes", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles single class", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });
});
