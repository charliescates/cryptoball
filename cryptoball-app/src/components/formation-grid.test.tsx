import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import FormationGrid from "./formation-grid";
import type { Player } from "./player";

interface MockPositionProps {
  index: number;
  onPositionClick: (index: number) => void;
  player: Player | null;
  positionName: string;
}

vi.mock("./position", () => ({
  default: ({ index, onPositionClick, player, positionName }: MockPositionProps) => (
    <button disabled={!player} onClick={() => onPositionClick(index)} type="button">
      {positionName} {index} {player ? `player-${player.id.toString()}` : "empty"}
    </button>
  ),
}));

vi.mock("./utils/chemistryCalculator", () => ({
  calculateTeamStats: vi.fn(() => ({
    activeChemistryBonuses: [
      {
        attackBonus: 6,
        defenseBonus: 0,
        description: "Strike Force",
        type: "attack",
      },
    ],
    baseAttack: 30,
    baseDefense: 20,
    chemistryBonusAttack: 6,
    chemistryBonusDefense: 0,
    finalAttack: 42,
    finalDefense: 25,
    playerTypeBonusAttack: 9,
    playerTypeBonusDefense: 5,
    positionAdjustedAttack: 39,
    positionAdjustedDefense: 25,
  })),
}));

const createPlayer = (id: bigint): Player => ({
  id,
  attack: 10n,
  defense: 8n,
  gamesLeft: 5n,
  goalsScored: 0n,
  originalAttack: 10n,
  originalDefense: 8n,
  playerType: 1n,
  potential: 75n,
});

describe("FormationGrid", () => {
  it("renders formation rows, stats, and handles position removal", async () => {
    const user = userEvent.setup();
    const onPositionClick = vi.fn();

    render(
      <FormationGrid
        formation={[createPlayer(1n), null, createPlayer(3n), null, null]}
        onPositionClick={onPositionClick}
        selectedFormation={{ name: "2-1-2", attack: 2, midfield: 1, defense: 2 }}
        teamColour="#32ff7e"
        teamName="Your Team"
      />,
    );

    expect(screen.getByRole("heading", { name: /your team/i })).toBeInTheDocument();
    expect(screen.getByText("2-1-2")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /attack 0 player-1/i }));

    expect(onPositionClick).toHaveBeenCalledWith(0);
  });

  it("toggles the bonus breakdown details", async () => {
    const user = userEvent.setup();

    render(
      <FormationGrid
        formation={[createPlayer(1n), createPlayer(2n), createPlayer(3n), null, null]}
        onPositionClick={vi.fn()}
        selectedFormation={{ name: "3-1-1", attack: 3, midfield: 1, defense: 1 }}
        teamColour="#32ff7e"
        teamName="Your Team"
      />,
    );

    await user.click(screen.getByRole("button", { name: /show bonus breakdown/i }));

    expect(screen.getByText("Stats Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Strike Force")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hide bonus breakdown/i }));

    expect(screen.queryByText("Stats Breakdown")).not.toBeInTheDocument();
  });
});
