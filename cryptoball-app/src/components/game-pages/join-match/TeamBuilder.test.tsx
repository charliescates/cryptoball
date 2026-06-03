import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Player } from "../../player";
import TeamBuilder from "./TeamBuilder";

vi.mock("../../formation-grid", () => ({
  default: ({ teamName }: { teamName: string }) => <div data-testid="formation-grid">{teamName}</div>,
}));

vi.mock("./PlayerRoster", () => ({
  default: ({ players }: { players: Player[] }) => <div data-testid="player-roster">{players.length}</div>,
}));

const players: Player[] = [
  {
    attack: 11n,
    defense: 7n,
    gamesLeft: 5n,
    goalsScored: 1n,
    id: 1n,
    originalAttack: 10n,
    originalDefense: 7n,
    playerType: 1n,
    potential: 82n,
  },
];
const fivePlayers = Array.from({ length: 5 }, (_, index) => ({
  ...players[0],
  id: BigInt(index + 1),
}));

describe("TeamBuilder", () => {
  it("shows formation controls and the helper hint", async () => {
    const user = userEvent.setup();
    const onClearFormation = vi.fn();
    const onAutoPick = vi.fn();
    const onFormationChange = vi.fn();
    const onPlayerClick = vi.fn();
    const onPositionClick = vi.fn();
    const onUseRecentSquad = vi.fn();

    render(
      <TeamBuilder
        formation={[null, null, null, null, null]}
        activePositionIndex={null}
        activePositionMeta={null}
        isFormationEmpty={false}
        ownedPlayers={fivePlayers}
        selectedCount={2}
        selectedFormation={{
          name: "3-1-1",
          attack: 3,
          midfield: 1,
          defense: 1,
          summary: "Front foot",
          intent: "Overload attack",
        }}
        selectedPlayerIds={new Set()}
        onAutoPick={onAutoPick}
        onClearFormation={onClearFormation}
        onFormationChange={onFormationChange}
        onPlayerClick={onPlayerClick}
        onPositionClick={onPositionClick}
        onUseRecentSquad={onUseRecentSquad}
        recentSquadLabel="Use squad from match #4"
        recentSquadMessage="Restored 5 players from your most recent match."
      />,
    );

    expect(screen.getByText("Build Your Match Five")).toBeInTheDocument();
    expect(screen.getByTestId("formation-grid")).toHaveTextContent("Your Team");
    expect(screen.getByTestId("player-roster")).toHaveTextContent("5");
    expect(screen.getByText(/choose players for your 1-1-3 formation/i)).toBeInTheDocument();
    expect(screen.getByText(/restored 5 players/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /use squad from match #4/i }));
    await user.click(screen.getByRole("button", { name: /2-1-2 balanced stable shape 2 att \/ 1 mid \/ 2 def/i }));
    await user.click(screen.getByRole("button", { name: "Best Team" }));
    await user.click(screen.getByRole("button", { name: "Reset Team" }));

    expect(onUseRecentSquad).toHaveBeenCalled();
    expect(onFormationChange).toHaveBeenCalledWith("2-1-2");
    expect(onAutoPick).toHaveBeenCalled();
    expect(onClearFormation).toHaveBeenCalled();
    expect(onPlayerClick).not.toHaveBeenCalled();
    expect(onPositionClick).not.toHaveBeenCalled();
  });

  it("disables clearing when the formation is empty", () => {
    render(
      <TeamBuilder
        formation={[null, null, null, null, null]}
        activePositionIndex={null}
        activePositionMeta={null}
        isFormationEmpty
        ownedPlayers={players}
        selectedCount={5}
        selectedFormation={{
          name: "3-1-1",
          attack: 3,
          midfield: 1,
          defense: 1,
          summary: "Front foot",
          intent: "Overload attack",
        }}
        selectedPlayerIds={new Set()}
        onAutoPick={vi.fn()}
        onClearFormation={vi.fn()}
        onFormationChange={vi.fn()}
        onPlayerClick={vi.fn()}
        onPositionClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Reset Team" })).toBeDisabled();
    expect(screen.queryByText(/choose players for your 1-1-3 formation/i)).not.toBeInTheDocument();
  });
});
