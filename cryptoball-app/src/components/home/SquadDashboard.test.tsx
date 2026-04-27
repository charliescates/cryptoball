import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import SquadDashboard from "./SquadDashboard";

describe("SquadDashboard", () => {
  it("shows squad stats and primary navigation cards", () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <SquadDashboard playerCount={7} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /your squad dashboard/i })).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view squad/i })).toHaveAttribute("href", "/players");
    expect(screen.getByRole("link", { name: /academy/i })).toHaveAttribute("href", "/academy");
    expect(screen.getByRole("link", { name: /matches/i })).toHaveAttribute("href", "/games");
    expect(screen.getByRole("link", { name: /chemistry/i })).toHaveAttribute("href", "/chemistry");
  });
});
