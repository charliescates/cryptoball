import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Player } from "../../player";
import PlayerRoster from "./PlayerRoster";

const createPlayer = (id: bigint): Player => ({
  id,
  originalAttack: 10n,
  attack: 12n,
  originalDefense: 8n,
  defense: 8n,
  potential: 70n,
  gamesLeft: 4n,
  goalsScored: 1n,
  playerType: 1n,
});

describe("PlayerRoster", () => {
  it("renders an empty state when there are no owned players", () => {
    render(<PlayerRoster players={[]} selectedCount={0} selectedPlayerIds={new Set()} onPlayerClick={vi.fn()} />);

    expect(screen.getByText(/selected: 0 \/ 5/i)).toBeInTheDocument();
    expect(screen.getByText(/no players available/i)).toBeInTheDocument();
  });

  it("calls the player selection handler when a player card is clicked", async () => {
    const user = userEvent.setup();
    const player = createPlayer(1n);
    const onPlayerClick = vi.fn();

    render(
      <PlayerRoster
        players={[player]}
        selectedCount={1}
        selectedPlayerIds={new Set([player.id])}
        onPlayerClick={onPlayerClick}
      />,
    );

    await user.click(screen.getByRole("button"));

    expect(screen.getByText(/selected: 1 \/ 5/i)).toBeInTheDocument();
    expect(onPlayerClick).toHaveBeenCalledWith(player);
  });
});
