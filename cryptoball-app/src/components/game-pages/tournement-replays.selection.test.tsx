import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  HOME_ADDRESS_ONE,
  HOME_ADDRESS_TWO,
  AWAY_ADDRESS_ONE,
  AWAY_ADDRESS_TWO,
  useQueryMock,
  useReadContractMock,
  useWaitForTransactionReceiptMock,
  useWriteContractMock,
} = vi.hoisted(() => ({
  HOME_ADDRESS_ONE: "0x0000000000000000000000000000000000000001",
  HOME_ADDRESS_TWO: "0x0000000000000000000000000000000000000003",
  AWAY_ADDRESS_ONE: "0x0000000000000000000000000000000000000002",
  AWAY_ADDRESS_TWO: "0x0000000000000000000000000000000000000004",
  useQueryMock: vi.fn(),
  useReadContractMock: vi.fn(),
  useWaitForTransactionReceiptMock: vi.fn(),
  useWriteContractMock: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (args: unknown) => useQueryMock(args),
}));

vi.mock("../../contracts/tournementContract", () => ({
  tournementContract: {
    address: "0x00000000000000000000000000000000000000aa",
    abi: [],
  },
}));

vi.mock("../../contracts/playerContract", () => ({
  playerContract: {
    address: "0x00000000000000000000000000000000000000bb",
    abi: [],
  },
}));

vi.mock("../../config/network", () => ({
  activeChain: { id: 31337 },
  nativeTokenSymbol: "POL",
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({ address: HOME_ADDRESS_ONE }),
  usePublicClient: () => null,
  useReadContract: (args: unknown) => useReadContractMock(args),
  useWriteContract: () => useWriteContractMock(),
  useWaitForTransactionReceipt: (args: unknown) => useWaitForTransactionReceiptMock(args),
}));

vi.mock("./join-match/useFormationBuilder", () => ({
  getFormationPositionMeta: () => ({ role: "attack" }),
  useFormationBuilder: () => ({
    activePositionIndex: null,
    activePositionMeta: null,
    applyFormation: vi.fn(),
    attackingPlayers: [],
    autoPickFormation: vi.fn(),
    clearFormation: vi.fn(),
    defensivePlayers: [],
    formation: [null, null, null, null, null],
    handleFormationChange: vi.fn(),
    handlePlayerClick: vi.fn(),
    handlePositionClick: vi.fn(),
    isFormationComplete: false,
    isFormationEmpty: true,
    midfieldPlayers: [],
    selectedCount: 0,
    selectedFormation: { attack: 2, midfield: 1, defense: 2, label: "2-1-2" },
    selectedPlayerIds: new Set<bigint>(),
  }),
}));

vi.mock("../actions/create-tournament/CreateTournamentModal", () => ({
  default: () => <div>Create tournament modal</div>,
}));

vi.mock("./join-match/TeamBuilder", () => ({
  default: () => <div>Team builder</div>,
}));

vi.mock("./show-matches", () => ({
  default: ({
    embeddedMatchId,
    embeddedTournamentId,
    onReplayComplete,
  }: {
    embeddedMatchId?: string;
    embeddedTournamentId?: string;
    onReplayComplete?: () => void;
  }) => {
    const [mountedReplay] = useState(`${embeddedTournamentId ?? "none"}:${embeddedMatchId ?? "none"}`);
    return (
      <div>
        <div data-testid="selected-replay-props">{mountedReplay}</div>
        {onReplayComplete ? (
          <button type="button" onClick={onReplayComplete}>
            Complete Replay
          </button>
        ) : null}
      </div>
    );
  },
}));

vi.mock("./tournementSubgraph", () => ({
  fetchTournamentMatchResultsFromSubgraph: vi.fn(),
}));

const { default: TournementReplays } = await import("./tournement-replays");

function buildTournament(matches: Array<{
  id: string;
  tournamentId: string;
  tournamentMatchId: string;
  round: number;
  homeAddress: string;
  awayAddress: string;
  winner: string;
  homeScore: number;
  awayScore: number;
}>) {
  return [
    {
      id: "1",
      name: "Summer Cup",
      creator: HOME_ADDRESS_ONE,
      rounds: 1,
      entryFee: 0n,
      minAttack: 0,
      minDefence: 0,
      maxAttack: 0,
      maxDefence: 0,
      includeTypes: [],
      excludeTypes: [],
      maxTeams: 2,
      matches: matches.map((match) => ({
        ...match,
        blockNumber: 50n,
      })),
      teamsEntered: 2,
      entrants: [],
      isReady: true,
      cancelled: false,
      currentRound: 1,
      activity: [],
    },
  ];
}

describe("TournementReplays replay selection", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    useReadContractMock.mockReset();
    useWriteContractMock.mockReset();
    useWaitForTransactionReceiptMock.mockReset();

    useReadContractMock.mockReturnValue({
      data: undefined,
      refetch: vi.fn(),
    });
    useWriteContractMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isPending: false,
      writeContract: vi.fn(),
    });
    useWaitForTransactionReceiptMock.mockReturnValue({
      isLoading: false,
      isSuccess: false,
    });
  });

  it("keeps the same replay selected when transient match ids reshuffle", async () => {
    const user = userEvent.setup();
    let tournaments = buildTournament([
      {
        id: "1-1-0",
        tournamentId: "1",
        tournamentMatchId: "101",
        round: 1,
        homeAddress: HOME_ADDRESS_ONE,
        awayAddress: AWAY_ADDRESS_ONE,
        winner: HOME_ADDRESS_ONE,
        homeScore: 2,
        awayScore: 0,
      },
      {
        id: "1-1-1",
        tournamentId: "1",
        tournamentMatchId: "202",
        round: 1,
        homeAddress: HOME_ADDRESS_TWO,
        awayAddress: AWAY_ADDRESS_TWO,
        winner: AWAY_ADDRESS_TWO,
        homeScore: 1,
        awayScore: 3,
      },
    ]);

    useQueryMock.mockImplementation(() => ({
      data: tournaments,
      error: undefined,
      refetch: vi.fn(),
      status: "success",
    }));

    const { rerender } = render(<TournementReplays section="live" />);

    const watchButtons = await screen.findAllByRole("button", { name: /watch replay/i });
    await user.click(watchButtons[0]);

    expect(screen.getByTestId("selected-replay-props")).toHaveTextContent("1:101");

    tournaments = buildTournament([
      {
        id: "1-1-0",
        tournamentId: "1",
        tournamentMatchId: "202",
        round: 1,
        homeAddress: HOME_ADDRESS_TWO,
        awayAddress: AWAY_ADDRESS_TWO,
        winner: AWAY_ADDRESS_TWO,
        homeScore: 1,
        awayScore: 3,
      },
      {
        id: "1-1-1",
        tournamentId: "1",
        tournamentMatchId: "101",
        round: 1,
        homeAddress: HOME_ADDRESS_ONE,
        awayAddress: AWAY_ADDRESS_ONE,
        winner: HOME_ADDRESS_ONE,
        homeScore: 2,
        awayScore: 0,
      },
    ]);

    rerender(<TournementReplays section="live" />);

    expect(screen.getByTestId("selected-replay-props")).toHaveTextContent("1:101");
  });

  it("remounts the embedded replay when switching live matches", async () => {
    const user = userEvent.setup();
    const tournaments = buildTournament([
      {
        id: "1-1-0",
        tournamentId: "1",
        tournamentMatchId: "101",
        round: 1,
        homeAddress: HOME_ADDRESS_ONE,
        awayAddress: AWAY_ADDRESS_ONE,
        winner: HOME_ADDRESS_ONE,
        homeScore: 2,
        awayScore: 0,
      },
      {
        id: "1-1-1",
        tournamentId: "1",
        tournamentMatchId: "202",
        round: 1,
        homeAddress: HOME_ADDRESS_TWO,
        awayAddress: AWAY_ADDRESS_TWO,
        winner: AWAY_ADDRESS_TWO,
        homeScore: 1,
        awayScore: 3,
      },
    ]);

    useQueryMock.mockImplementation(() => ({
      data: tournaments,
      error: undefined,
      refetch: vi.fn(),
      status: "success",
    }));

    render(<TournementReplays section="live" />);

    let watchButtons = await screen.findAllByRole("button", { name: /watch replay/i });
    await user.click(watchButtons[0]);
    expect(screen.getByTestId("selected-replay-props")).toHaveTextContent("1:101");

    watchButtons = await screen.findAllByRole("button", { name: /replay opened|watch replay/i });
    await user.click(watchButtons[1]);

    expect(screen.getByTestId("selected-replay-props")).toHaveTextContent("1:202");
  });

  it("unlocks next completed round after replay completion from any match in prior round", async () => {
    const user = userEvent.setup();
    const completedTournament = [
      {
        id: "1",
        name: "Summer Cup",
        creator: HOME_ADDRESS_ONE,
        rounds: 2,
        entryFee: 0n,
        minAttack: 0,
        minDefence: 0,
        maxAttack: 0,
        maxDefence: 0,
        includeTypes: [],
        excludeTypes: [],
        maxTeams: 4,
        matches: [
          {
            id: "1-1-0",
            tournamentId: "1",
            tournamentMatchId: "101",
            round: 1,
            homeAddress: HOME_ADDRESS_ONE,
            awayAddress: AWAY_ADDRESS_ONE,
            winner: HOME_ADDRESS_ONE,
            homeScore: 2,
            awayScore: 1,
            blockNumber: 10n,
          },
          {
            id: "1-1-1",
            tournamentId: "1",
            tournamentMatchId: "102",
            round: 1,
            homeAddress: HOME_ADDRESS_TWO,
            awayAddress: AWAY_ADDRESS_TWO,
            winner: AWAY_ADDRESS_TWO,
            homeScore: 0,
            awayScore: 1,
            blockNumber: 11n,
          },
          {
            id: "1-2-0",
            tournamentId: "1",
            tournamentMatchId: "201",
            round: 2,
            homeAddress: HOME_ADDRESS_ONE,
            awayAddress: AWAY_ADDRESS_TWO,
            winner: AWAY_ADDRESS_TWO,
            homeScore: 1,
            awayScore: 2,
            blockNumber: 12n,
          },
        ],
        champion: AWAY_ADDRESS_TWO,
        teamsEntered: 4,
        entrants: [],
        isReady: false,
        cancelled: false,
        currentRound: 2,
        activity: [],
      },
    ];

    useQueryMock.mockImplementation(() => ({
      data: completedTournament,
      error: undefined,
      refetch: vi.fn(),
      status: "success",
    }));

    render(<TournementReplays section="completed" />);

    const playRoundButtons = await screen.findAllByRole("button", { name: /play round/i });
    await user.click(playRoundButtons[0]);

    expect(screen.getByTestId("selected-replay-props")).toHaveTextContent("1:101");

    let watchButtons = await screen.findAllByRole("button", { name: /watch match|replay opened/i });
    await user.click(watchButtons[1]);

    expect(screen.getByTestId("selected-replay-props")).toHaveTextContent("1:102");

    const nextRoundButton = await screen.findByRole("button", { name: /next round/i });
    expect(nextRoundButton).toBeDisabled();

    const completeReplayButton = await screen.findByRole("button", { name: /complete replay/i });
    await user.click(completeReplayButton);

    watchButtons = await screen.findAllByRole("button", { name: /watch match|replay opened/i });
    expect(watchButtons.length).toBeGreaterThan(0);

    expect(nextRoundButton).toBeEnabled();
    await user.click(nextRoundButton);

    expect(screen.getByTestId("selected-replay-props")).toHaveTextContent("1:201");
  });
});