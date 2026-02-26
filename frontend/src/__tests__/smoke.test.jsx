import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import SolarRadiationPage from "../pages/SolarPage";

describe("smoke", () => {
  it("renders Solar Radiation page", () => {
    const { container } = render(<SolarRadiationPage />);
    expect(container.firstChild).toBeTruthy();
  });
});
