import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Player } from "../player";
import SquadPlayerCard from "./SquadPlayerCard";

vi.mock("../avatar/FootballPlayerAvatar", () => ({
  default: () => <div data-testid="football-avatar" />,
}));

const player: Player = {
  id: 1n,
  originalAttack: 10n,
  attack: 13n,
  originalDefense: 9n,
  defense: 7n,
  potential: 85n,
  gamesLeft: 5n,
  goalsScored: 2n,
  playerType: 1n,
};

describe("SquadPlayerCard", () => {
  it("renders player stats with signed deltas and summary details", () => {
    render(<SquadPlayerCard player={player} />);

    expect(screen.getByTestId("football-avatar")).toBeInTheDocument();
    expect(screen.getByText("Target Man")).toBeInTheDocument();
    expect(screen.getByText("+3")).toHaveClass("stat-delta-positive");
    expect(screen.getByText("-2")).toHaveClass("stat-delta-negative");
    expect(screen.getByText(/games left/i)).toHaveTextContent("Games left 5");
    expect(screen.getByText(/goals/i)).toHaveTextContent("Goals 2");
  });
});
