import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import JoinMatchPage from "./join-match-page";

const formationBuilder = {
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
  selectedFormation: { attack: 2, defense: 1, midfield: 2, name: "2-2-1" },
  selectedPlayerIds: new Set<bigint>(),
};

vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useReadContract: vi.fn(),
  useWatchContractEvent: vi.fn(),
}));

vi.mock("./join-match/useFormationBuilder", () => ({
  useFormationBuilder: () => formationBuilder,
}));

vi.mock("./join-match/MatchSelector", () => ({
  default: () => <div>Match Selector</div>,
}));

vi.mock("./join-match/TeamBuilder", () => ({
  default: () => <div>Team Builder</div>,
}));

vi.mock("./join-match/SubmitTeamSection", () => ({
  default: () => <div>Submit Team</div>,
}));

vi.mock("./join-match/GameResult", () => ({
  default: () => <div>Game Result</div>,
}));

const { useAccount, useReadContract } = await import("wagmi");

type MockAccount = {
  address?: string;
  isConnected: boolean;
};

type MockReadContractResult = {
  data: unknown;
};

describe("JoinMatchPage", () => {
  it("passes contract data into the match builder layout", () => {
    vi.mocked(useAccount).mockReturnValue({ address: "0xabc", isConnected: true } as MockAccount as never);
    vi.mocked(useReadContract)
      .mockReturnValueOnce({ data: [{ id: 1n }] } as MockReadContractResult as never)
      .mockReturnValueOnce({ data: [3, 4] } as MockReadContractResult as never)
      .mockReturnValueOnce({
        data: { homeAddress: "0x1", awayAddress: "0x2", pot: 0n, wagerRequired: 0n },
      } as MockReadContractResult as never);

    render(<JoinMatchPage />);

    expect(screen.getByText("Match Selector")).toBeInTheDocument();
    expect(screen.getByText("Team Builder")).toBeInTheDocument();
    expect(screen.getByText("Submit Team")).toBeInTheDocument();
  });
});
