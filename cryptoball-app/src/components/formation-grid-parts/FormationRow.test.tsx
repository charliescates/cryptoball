import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Player } from "../player";
import FormationRow from "./FormationRow";

vi.mock("../position", () => ({
  default: ({
    index,
    onPositionClick,
    player,
    positionName,
  }: {
    index: number;
    onPositionClick: (index: number) => void;
    player: Player | null;
    positionName: string;
  }) => (
    <button disabled={!player} onClick={() => onPositionClick(index)} type="button">
      {positionName} {index} {player ? player.id.toString() : "empty"}
    </button>
  ),
}));

const createPlayer = (id: bigint): Player => ({
  attack: 10n,
  defense: 8n,
  gamesLeft: 5n,
  goalsScored: 0n,
  id,
  originalAttack: 10n,
  originalDefense: 8n,
  playerType: 1n,
  potential: 75n,
});

describe("FormationRow", () => {
  it("renders one position button per slot", () => {
    render(
      <FormationRow
        count={2}
        formation={[createPlayer(1n), null]}
        icon="⚔️"
        label="ATTACK"
        onPositionClick={vi.fn()}
        startIndex={0}
        teamColour="#32ff7e"
      />,
    );

    expect(screen.getByText(/attack 0 1/i)).toBeInTheDocument();
    expect(screen.getByText(/attack 1 empty/i)).toBeInTheDocument();
  });

  it("calls back when a filled position is clicked", async () => {
    const user = userEvent.setup();
    const onPositionClick = vi.fn();

    render(
      <FormationRow
        count={1}
        formation={[createPlayer(1n)]}
        icon="⚔️"
        label="ATTACK"
        onPositionClick={onPositionClick}
        startIndex={0}
        teamColour="#32ff7e"
      />,
    );

    await user.click(screen.getByRole("button", { name: /attack 0 1/i }));

    expect(onPositionClick).toHaveBeenCalledWith(0);
  });
});
