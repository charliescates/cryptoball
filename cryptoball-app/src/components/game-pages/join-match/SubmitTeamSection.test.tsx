import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
        hasBothTeamsSubmitted={false}
        hasOwnTeamSubmitted={false}
        isFormationComplete={false}
        isReplayPending={false}
        isReplayReady={false}
        midfieldPlayers={[]}
        onWatchReplay={vi.fn()}
        selectedMatchId={null}
      />,
    );

    expect(screen.getByText(/select all 5 players before locking your team/i)).toBeInTheDocument();
    expect(screen.getByText(/choose a match before locking your team/i)).toBeInTheDocument();
  });

  it("passes match, team, and wager props into AddTeam", () => {
    const attackingPlayers = [createPlayer(1n), createPlayer(2n)];
    const midfieldPlayers = [createPlayer(3n)];
    const defensivePlayers = [createPlayer(4n), createPlayer(5n)];

    render(
      <SubmitTeamSection
        attackingPlayers={attackingPlayers}
        defensivePlayers={defensivePlayers}
        hasBothTeamsSubmitted={true}
        hasOwnTeamSubmitted={true}
        isFormationComplete={true}
        matchDetails={{
          homeAddress: "",
          homeTeam: { attackingPlayers: [0n, 0n, 0n], midfieldPlayers: [0n, 0n, 0n], defensivePlayers: [0n, 0n, 0n] },
          awayAddress: "",
          awayTeam: { attackingPlayers: [0n, 0n, 0n], midfieldPlayers: [0n, 0n, 0n], defensivePlayers: [0n, 0n, 0n] },
          pot: 0n,
          wagerRequired: 1500000000000000000n,
        }}
        isReplayPending={false}
        isReplayReady={false}
        midfieldPlayers={midfieldPlayers}
        onWatchReplay={vi.fn()}
        selectedMatchId={22}
      />,
    );

    expect(screen.queryByText(/select all 5 players before locking your team/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/choose a match before locking your team/i)).not.toBeInTheDocument();
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

  it("shows a play match action once both teams are ready", async () => {
    const user = userEvent.setup();
    const onWatchReplay = vi.fn();

    render(
      <SubmitTeamSection
        attackingPlayers={[]}
        defensivePlayers={[]}
        hasBothTeamsSubmitted={true}
        hasOwnTeamSubmitted={true}
        isFormationComplete={true}
        matchDetails={{
          homeAddress: "",
          homeTeam: { attackingPlayers: [1n, 2n, 3n], midfieldPlayers: [4n, 0n, 0n], defensivePlayers: [5n, 0n, 0n] },
          awayAddress: "",
          awayTeam: { attackingPlayers: [6n, 7n, 8n], midfieldPlayers: [9n, 0n, 0n], defensivePlayers: [10n, 0n, 0n] },
          pot: 0n,
          wagerRequired: 0n,
        }}
        isReplayPending={false}
        isReplayReady={true}
        midfieldPlayers={[]}
        onWatchReplay={onWatchReplay}
        selectedMatchId={9}
      />,
    );

    await user.click(screen.getByRole("button", { name: /opening replay/i }));
    expect(onWatchReplay).toHaveBeenCalled();
  });
});
