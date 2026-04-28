import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Position from "./position";
import type { Player } from "./player";

vi.mock("./avatar/FootballPlayerAvatar", () => ({
  default: () => <div data-testid="position-avatar" />,
}));

const player: Player = {
  attack: 12n,
  defense: 8n,
  gamesLeft: 4n,
  goalsScored: 1n,
  id: 5n,
  originalAttack: 10n,
  originalDefense: 8n,
  playerType: 2n,
  potential: 77n,
};

describe("Position", () => {
  it("renders an empty slot", () => {
    render(
      <Position index={0} onPositionClick={vi.fn()} player={null} positionName="ATTACK" teamColour="#32ff7e" />,
    );

    expect(screen.getByText("ATTACK")).toBeInTheDocument();
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });

  it("renders a filled slot and removes the player when clicked", async () => {
    const user = userEvent.setup();
    const onPositionClick = vi.fn();

    render(
      <Position index={2} onPositionClick={onPositionClick} player={player} positionName="MIDFIELD" teamColour="#32ff7e" />,
    );

    expect(screen.getByText(/Jérémy\s+Insigne/)).toBeInTheDocument();
    expect(screen.getByTestId("position-avatar")).toBeInTheDocument();
    await user.click(screen.getByText("Click to remove"));

    expect(onPositionClick).toHaveBeenCalledWith(2);
  });
});
