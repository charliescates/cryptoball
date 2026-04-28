import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Player } from "../../player";
import SubmitTeamSection from "./SubmitTeamSection";

const addTeamSpy = vi.fn();

interface MockAddTeamProps {
  attackingPlayers: Player[];
  defensivePlayers: Player[];
  matchId: string;
  midfieldPlayers: Player[];
  wager: string;
}

vi.mock("../../actions/addTeam", () => ({
  default: (props: MockAddTeamProps) => {
    addTeamSpy(props);
    return <div data-testid="add-team">Add team mock</div>;
  },
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

describe("SubmitTeamSection", () => {
  it("shows warnings until a match and full formation are selected", () => {
    render(
      <SubmitTeamSection
        attackingPlayers={[]}
        defensivePlayers={[]}
        isFormationComplete={false}
        midfieldPlayers={[]}
        selectedMatchId={null}
      />,
    );

    expect(screen.getByText(/please select all 5 players/i)).toBeInTheDocument();
    expect(screen.getByText(/please select a match/i)).toBeInTheDocument();
  });

  it("passes match, team, and wager props into AddTeam", () => {
    const attackingPlayers = [createPlayer(1n), createPlayer(2n)];
    const midfieldPlayers = [createPlayer(3n)];
    const defensivePlayers = [createPlayer(4n), createPlayer(5n)];

    render(
      <SubmitTeamSection
        attackingPlayers={attackingPlayers}
        defensivePlayers={defensivePlayers}
        isFormationComplete={true}
        matchDetails={{
          homeAddress: "",
          awayAddress: "",
          pot: 0n,
          wagerRequired: 1500000000000000000n,
        }}
        midfieldPlayers={midfieldPlayers}
        selectedMatchId={22}
      />,
    );

    expect(screen.queryByText(/please select/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("add-team")).toBeInTheDocument();
    expect(addTeamSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        attackingPlayers,
        defensivePlayers,
        matchId: "22",
        midfieldPlayers,
        wager: "1.5",
      }),
    );
  });
});
