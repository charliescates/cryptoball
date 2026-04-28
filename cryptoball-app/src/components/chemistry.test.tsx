import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Chemistry from "./chemistry";

describe("Chemistry", () => {
  it("renders the guide sections and reference data", () => {
    render(<Chemistry />);

    expect(screen.getByText("Chemistry System Guide")).toBeInTheDocument();
    expect(screen.getByText("How It Works")).toBeInTheDocument();
    expect(screen.getByText("Player Type Reference")).toBeInTheDocument();
    expect(screen.getByText("Chemistry Bonuses")).toBeInTheDocument();
    expect(screen.getByText("Reference Grid")).toBeInTheDocument();
    expect(screen.getByText("Quick Rules")).toBeInTheDocument();
  });
});
