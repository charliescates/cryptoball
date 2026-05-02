import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import JoinMatchPage from "./join-match-page";

const formationBuilder = {
  activePositionIndex: null,
  activePositionMeta: null,
  attackingPlayers: [],
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
  selectedFormation: {
    attack: 2,
    defense: 1,
    intent: "Fast transitions",
    midfield: 2,
    name: "2-2-1",
    summary: "Press",
  },
  selectedPlayerIds: new Set<bigint>(),
};

vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useReadContract: vi.fn(),
  useWatchContractEvent: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

const navigateSpy = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  };
});

vi.mock("./join-match/useFormationBuilder", () => ({
  useFormationBuilder: () => formationBuilder,
}));

vi.mock("./join-match/MatchSelector", () => ({
  default: ({ disabled, onMatchChange }: { disabled?: boolean; onMatchChange: (matchId: number) => void }) => (
    <div>
      <div>Match Selector</div>
      <div>{disabled ? "Selector Locked" : "Selector Editable"}</div>
      <button type="button" onClick={() => onMatchChange(4)}>
        Pick Match
      </button>
    </div>
  ),
}));

vi.mock("./join-match/TeamBuilder", () => ({
  default: () => <div>Team Builder</div>,
}));

vi.mock("./join-match/SubmitTeamSection", () => ({
  default: ({
    onTransactionConfirmed,
    onTransactionStarted,
  }: {
    onTransactionConfirmed?: () => void;
    onTransactionStarted?: () => void;
  }) => (
    <div>
      <div>Submit Team</div>
      <button
        type="button"
        onClick={() => {
          onTransactionStarted?.();
          onTransactionConfirmed?.();
        }}
      >
        Submit Team Mock
      </button>
    </div>
  ),
}));

vi.mock("./join-match/GameResult", () => ({
  default: () => <div>Game Result</div>,
}));

const { useQuery } = await import("@tanstack/react-query");
const { useAccount, useReadContract } = await import("wagmi");

type MockAccount = {
  address?: string;
  isConnected: boolean;
};

type MockReadContractResult = {
  data: unknown;
};

describe("JoinMatchPage", () => {
  beforeEach(() => {
    navigateSpy.mockClear();
    vi.mocked(useQuery).mockReturnValue({ data: undefined, status: "pending" } as never);
  });

  it("locks squad setup until a match is selected", () => {
    vi.mocked(useAccount).mockReturnValue({ address: "0xabc", isConnected: true } as MockAccount as never);
    vi.mocked(useReadContract).mockImplementation((config: { functionName?: string } | undefined) => {
      const functionName = config?.functionName;
      if (functionName === "getPlayersByOwner") {
        return { data: [{ id: 1n }] } as MockReadContractResult as never;
      }

      if (functionName === "getMatchList") {
        return { data: [3, 4] } as MockReadContractResult as never;
      }

      if (functionName === "getMatch") {
        return {
          data: {
            homeAddress: "0x1",
            homeTeam: {
              attackingPlayers: [0n, 0n, 0n],
              midfieldPlayers: [0n, 0n, 0n],
              defensivePlayers: [0n, 0n, 0n],
            },
            awayAddress: "0x2",
            awayTeam: {
              attackingPlayers: [0n, 0n, 0n],
              midfieldPlayers: [0n, 0n, 0n],
              defensivePlayers: [0n, 0n, 0n],
            },
            pot: 0n,
            wagerRequired: 0n,
          },
        } as MockReadContractResult as never;
      }

      return { data: undefined } as MockReadContractResult as never;
    });

    render(
      <MemoryRouter>
        <JoinMatchPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Match Selector")).toBeInTheDocument();
    expect(screen.getByText("Select a Match First")).toBeInTheDocument();
    expect(screen.queryByText("Team Builder")).not.toBeInTheDocument();
    expect(screen.queryByText("Submit Team")).not.toBeInTheDocument();
  });

  it("shows the team builder after selecting a match", async () => {
    const user = userEvent.setup();
    vi.mocked(useAccount).mockReturnValue({ address: "0xabc", isConnected: true } as MockAccount as never);
    vi.mocked(useReadContract).mockImplementation((config: { functionName?: string } | undefined) => {
      const functionName = config?.functionName;
      if (functionName === "getPlayersByOwner") {
        return { data: [{ id: 1n }] } as MockReadContractResult as never;
      }

      if (functionName === "getMatchList") {
        return { data: [3, 4] } as MockReadContractResult as never;
      }

      if (functionName === "getMatch") {
        return {
          data: {
            homeAddress: "0x1",
            homeTeam: {
              attackingPlayers: [0n, 0n, 0n],
              midfieldPlayers: [0n, 0n, 0n],
              defensivePlayers: [0n, 0n, 0n],
            },
            awayAddress: "0x2",
            awayTeam: {
              attackingPlayers: [0n, 0n, 0n],
              midfieldPlayers: [0n, 0n, 0n],
              defensivePlayers: [0n, 0n, 0n],
            },
            pot: 0n,
            wagerRequired: 0n,
          },
        } as MockReadContractResult as never;
      }

      return { data: undefined } as MockReadContractResult as never;
    });

    render(
      <MemoryRouter>
        <JoinMatchPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Pick Match" }));

    expect(screen.queryByText("Select a Match First")).not.toBeInTheDocument();
    expect(screen.getByText("Team Builder")).toBeInTheDocument();
    expect(screen.getByText("Submit Team")).toBeInTheDocument();
  });

  it("locks the team builder after submitting the team transaction", async () => {
    const user = userEvent.setup();
    vi.mocked(useAccount).mockReturnValue({ address: "0xabc", isConnected: true } as MockAccount as never);
    vi.mocked(useReadContract).mockImplementation((config: { functionName?: string } | undefined) => {
      const functionName = config?.functionName;
      if (functionName === "getPlayersByOwner") {
        return { data: [{ id: 1n }] } as MockReadContractResult as never;
      }

      if (functionName === "getMatchList") {
        return { data: [4] } as MockReadContractResult as never;
      }

      if (functionName === "getMatch") {
        return {
          data: {
            homeAddress: "0x1",
            homeTeam: {
              attackingPlayers: [0n, 0n, 0n],
              midfieldPlayers: [0n, 0n, 0n],
              defensivePlayers: [0n, 0n, 0n],
            },
            awayAddress: "0xabc",
            awayTeam: {
              attackingPlayers: [0n, 0n, 0n],
              midfieldPlayers: [0n, 0n, 0n],
              defensivePlayers: [0n, 0n, 0n],
            },
            pot: 0n,
            wagerRequired: 0n,
          },
          refetch: vi.fn(),
        } as MockReadContractResult as never;
      }

      return { data: undefined } as MockReadContractResult as never;
    });

    render(
      <MemoryRouter>
        <JoinMatchPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Pick Match" }));
    await user.click(screen.getByRole("button", { name: "Submit Team Mock" }));

    expect(screen.queryByText("Team Builder")).not.toBeInTheDocument();
    expect(screen.getByText("Your Team Is Locked")).toBeInTheDocument();
    expect(screen.getByText("Selector Locked")).toBeInTheDocument();
  });

  it("redirects to the replay when the submitted match is ready", async () => {
    const user = userEvent.setup();
    vi.mocked(useQuery).mockImplementation((config: { enabled?: boolean } | undefined) =>
      config?.enabled
        ? ({ data: { playedMatches: [{ matchId: "4" }] }, status: "success" } as never)
        : ({ data: undefined, status: "pending" } as never),
    );
    vi.mocked(useAccount).mockReturnValue({ address: "0xabc", isConnected: true } as MockAccount as never);
    vi.mocked(useReadContract).mockImplementation((config: { functionName?: string } | undefined) => {
      const functionName = config?.functionName;
      if (functionName === "getPlayersByOwner") {
        return { data: [{ id: 1n }] } as MockReadContractResult as never;
      }

      if (functionName === "getMatchList") {
        return { data: [4] } as MockReadContractResult as never;
      }

      if (functionName === "getMatch") {
        return {
          data: {
            homeAddress: "0x1",
            homeTeam: {
              attackingPlayers: [0n, 0n, 0n],
              midfieldPlayers: [0n, 0n, 0n],
              defensivePlayers: [0n, 0n, 0n],
            },
            awayAddress: "0xabc",
            awayTeam: {
              attackingPlayers: [0n, 0n, 0n],
              midfieldPlayers: [0n, 0n, 0n],
              defensivePlayers: [0n, 0n, 0n],
            },
            pot: 0n,
            wagerRequired: 0n,
          },
          refetch: vi.fn(),
        } as MockReadContractResult as never;
      }

      return { data: undefined } as MockReadContractResult as never;
    });

    render(
      <MemoryRouter>
        <JoinMatchPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "Pick Match" }));
    await user.click(screen.getByRole("button", { name: "Submit Team Mock" }));

    await waitFor(() => {
      expect(navigateSpy).toHaveBeenCalledWith("/games/recent?matchId=4&autoplay=1");
    });
  });
});
