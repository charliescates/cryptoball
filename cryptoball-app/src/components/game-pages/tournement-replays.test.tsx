import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TournementReplays from "./tournement-replays";

const {
  AWAY_ADDRESS_ONE,
  AWAY_ADDRESS_TWO,
  HOME_ADDRESS_ONE,
  HOME_ADDRESS_TWO,
  TOURNAMENT_CONTRACT_ADDRESS,
  fetchTournamentMatchResultsFromSubgraph,
  usePublicClientMock,
  useReadContractMock,
  useWaitForTransactionReceiptMock,
  useWriteContractMock,
} = vi.hoisted(() => ({
  AWAY_ADDRESS_ONE: "0x0000000000000000000000000000000000000002",
  AWAY_ADDRESS_TWO: "0x0000000000000000000000000000000000000004",
  HOME_ADDRESS_ONE: "0x0000000000000000000000000000000000000001",
  HOME_ADDRESS_TWO: "0x0000000000000000000000000000000000000003",
  TOURNAMENT_CONTRACT_ADDRESS: "0x00000000000000000000000000000000000000aa",
  fetchTournamentMatchResultsFromSubgraph: vi.fn(),
  usePublicClientMock: vi.fn(),
  useReadContractMock: vi.fn(),
  useWaitForTransactionReceiptMock: vi.fn(),
  useWriteContractMock: vi.fn(),
}));

vi.mock("../../contracts/tournementContract", () => ({
  tournementContract: {
    address: TOURNAMENT_CONTRACT_ADDRESS,
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
  usePublicClient: () => usePublicClientMock(),
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
  default: ({ embeddedMatchId, embeddedTournamentId }: { embeddedMatchId?: string; embeddedTournamentId?: string }) => (
    <div data-testid="selected-replay-props">{`${embeddedTournamentId ?? "none"}:${embeddedMatchId ?? "none"}`}</div>
  ),
}));

vi.mock("./tournementSubgraph", () => ({
  fetchTournamentMatchResultsFromSubgraph: (...args: unknown[]) => fetchTournamentMatchResultsFromSubgraph(...args),
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0,
        retry: false,
      },
    },
  });
}

function renderTournementReplays(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <TournementReplays section="live" />
    </QueryClientProvider>,
  );
}

describe("TournementReplays", () => {
  beforeEach(() => {
    fetchTournamentMatchResultsFromSubgraph.mockReset();
    usePublicClientMock.mockReset();
    useReadContractMock.mockReset();
    useWriteContractMock.mockReset();
    useWaitForTransactionReceiptMock.mockReset();

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
    useReadContractMock.mockReturnValue({
      data: undefined,
      refetch: vi.fn(),
    });
  });

  it("keeps the selected live replay pinned to the same tournament match after refetch reorders equal-block results", async () => {
    const user = userEvent.setup();
    const queryClient = createQueryClient();
    const tournamentSummary = {
      tournamentId: 1n,
      name: "Summer Cup",
      rounds: 1n,
      entryFee: 0n,
      minAttack: 0n,
      minDefence: 0n,
      maxAttack: 0n,
      maxDefence: 0n,
      includeTypes: [],
      excludeTypes: [],
      creator: HOME_ADDRESS_ONE,
      teamsEntered: 2n,
      maxTeams: 2n,
      isOpen: false,
      isReady: true,
      cancelled: false,
      currentRound: 1n,
      champion: "0x0000000000000000000000000000000000000000",
    };
    let replayResults = [
      {
        id: "played-a",
        tournamentId: "1",
        tournamentMatchId: "101",
        round: 1,
        homeAddress: HOME_ADDRESS_ONE,
        awayAddress: AWAY_ADDRESS_ONE,
        winner: HOME_ADDRESS_ONE,
        homeScore: 2,
        awayScore: 0,
        blockNumber: "50",
        blockTimestamp: "100",
        transactionHash: "0xaaa",
      },
      {
        id: "played-b",
        tournamentId: "1",
        tournamentMatchId: "202",
        round: 1,
        homeAddress: HOME_ADDRESS_TWO,
        awayAddress: AWAY_ADDRESS_TWO,
        winner: AWAY_ADDRESS_TWO,
        homeScore: 1,
        awayScore: 3,
        blockNumber: "50",
        blockTimestamp: "100",
        transactionHash: "0xbbb",
      },
    ];

    fetchTournamentMatchResultsFromSubgraph.mockImplementation(async () => ({
      tournamentMatchPlayeds: replayResults,
    }));

    usePublicClientMock.mockReturnValue({
      multicall: vi.fn().mockImplementation(async ({ contracts }: { contracts: unknown[] }) => {
        if (contracts.length === 128) {
          return Array.from({ length: 128 }, () => ({ status: "failure" as const }));
        }

        return [{ status: "success" as const, result: 0n }];
      }),
      readContract: vi.fn().mockResolvedValue([tournamentSummary]),
    });

    renderTournementReplays(queryClient);

    const watchButtons = await screen.findAllByRole("button", { name: /watch replay/i });
    await user.click(watchButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("selected-replay-props")).toHaveTextContent("1:101");
    });

    replayResults = [replayResults[1], replayResults[0]];
    await queryClient.invalidateQueries({ queryKey: ["tournament-feed", TOURNAMENT_CONTRACT_ADDRESS] });

    await waitFor(() => {
      expect(fetchTournamentMatchResultsFromSubgraph).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("selected-replay-props")).toHaveTextContent("1:101");
    });
  });
});