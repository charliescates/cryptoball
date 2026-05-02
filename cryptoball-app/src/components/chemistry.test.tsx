import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Chemistry from "./chemistry";

describe("Chemistry", () => {
  it("renders the guide sections and reference data", () => {
    render(<Chemistry />);

    expect(screen.getByText("Plan Stronger Teams")).toBeInTheDocument();
    expect(screen.getByText("Try a Team Shape")).toBeInTheDocument();
    expect(screen.getByText("Build Chemistry in Four Moves")).toBeInTheDocument();
    expect(screen.getByText("Bonus Reference")).toBeInTheDocument();
    expect(screen.getByText("Player Type Strengths")).toBeInTheDocument();
    expect(screen.getByText("How Final Stats Are Built")).toBeInTheDocument();
  });
});
