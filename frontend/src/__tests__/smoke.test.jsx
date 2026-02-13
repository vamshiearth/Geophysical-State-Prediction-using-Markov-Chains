import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import SolarPage from "../pages/SolarPage";

describe("smoke", () => {
  it("renders Solar page", () => {
    const { container } = render(<SolarPage />);
    expect(container.firstChild).toBeTruthy();
  });
});
