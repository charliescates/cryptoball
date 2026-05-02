import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import type { Player } from "../player";
import SquadDashboard from "./SquadDashboard";

const players: Player[] = [
  {
    attack: 80n,
    defense: 60n,
    gamesLeft: 4n,
    goalsScored: 3n,
    id: 1n,
    originalAttack: 75n,
    originalDefense: 60n,
    playerType: 1n,
    potential: 90n,
  },
  {
    attack: 50n,
    defense: 58n,
    gamesLeft: 0n,
    goalsScored: 0n,
    id: 2n,
    originalAttack: 50n,
    originalDefense: 55n,
    playerType: 3n,
    potential: 72n,
  },
];

describe("SquadDashboard", () => {
  it("shows squad stats and primary navigation cards", () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <SquadDashboard players={players} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /your squad dashboard/i })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Avg OVR")).toBeInTheDocument();
    expect(screen.getByLabelText("Club overview")).toHaveTextContent("Best player");
    expect(screen.getByRole("link", { name: /view squad/i })).toHaveAttribute("href", "/players");
    expect(screen.getByRole("link", { name: /academy/i })).toHaveAttribute("href", "/academy");
    expect(screen.getByRole("link", { name: /matches/i })).toHaveAttribute("href", "/games");
    expect(screen.getByRole("link", { name: /chemistry/i })).toHaveAttribute("href", "/chemistry");
  });
});
