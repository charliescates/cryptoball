import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import TeamBuilder from "./TeamBuilder";
import type { Player } from "../../player";

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

describe("TeamBuilder", () => {
  it("shows formation controls and the helper hint", async () => {
    const user = userEvent.setup();
    const onClearFormation = vi.fn();
    const onFormationChange = vi.fn();
    const onPlayerClick = vi.fn();
    const onPositionClick = vi.fn();

    render(
      <TeamBuilder
        formation={[null, null, null, null, null]}
        isFormationEmpty={false}
        ownedPlayers={players}
        selectedCount={2}
        selectedFormation={{ name: "3-1-1", attack: 3, midfield: 1, defense: 1 }}
        selectedPlayerIds={new Set()}
        onClearFormation={onClearFormation}
        onFormationChange={onFormationChange}
        onPlayerClick={onPlayerClick}
        onPositionClick={onPositionClick}
      />,
    );

    expect(screen.getByText("Build Your Team (5-a-side)")).toBeInTheDocument();
    expect(screen.getByTestId("formation-grid")).toHaveTextContent("Your Team");
    expect(screen.getByTestId("player-roster")).toHaveTextContent("1");
    expect(screen.getByText(/you need 5 players total/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Formation:"), "2-1-2");
    await user.click(screen.getByRole("button", { name: "Clear Formation" }));

    expect(onFormationChange).toHaveBeenCalledWith("2-1-2");
    expect(onClearFormation).toHaveBeenCalled();
    expect(onPlayerClick).not.toHaveBeenCalled();
    expect(onPositionClick).not.toHaveBeenCalled();
  });

  it("disables clearing when the formation is empty", () => {
    render(
      <TeamBuilder
        formation={[null, null, null, null, null]}
        isFormationEmpty
        ownedPlayers={players}
        selectedCount={5}
        selectedFormation={{ name: "3-1-1", attack: 3, midfield: 1, defense: 1 }}
        selectedPlayerIds={new Set()}
        onClearFormation={vi.fn()}
        onFormationChange={vi.fn()}
        onPlayerClick={vi.fn()}
        onPositionClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Clear Formation" })).toBeDisabled();
    expect(screen.queryByText(/you need 5 players total/i)).not.toBeInTheDocument();
  });
});
