import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { parseEther } from "viem";
import { describe, expect, it, vi } from "vitest";

import type { Player } from "../player";
import AddTeam from "./addTeam";

const writeContractSpy = vi.fn();
const resetSpy = vi.fn();

vi.mock("wagmi", () => ({
  useWaitForTransactionReceipt: vi.fn(() => ({ isLoading: false, isSuccess: false })),
  useWriteContract: vi.fn(() => ({
    data: undefined,
    error: undefined,
    isPending: false,
    reset: resetSpy,
    writeContract: writeContractSpy,
  })),
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

describe("AddTeam", () => {
  it("submits the team payload with padded player ids", async () => {
    const user = userEvent.setup();

    render(
      <AddTeam
        matchId="11"
        attackingPlayers={[createPlayer(1n)]}
        midfieldPlayers={[createPlayer(2n)]}
        defensivePlayers={[]}
        wager="1.25"
      />,
    );

    await user.click(screen.getByRole("button", { name: /add team/i }));

    expect(resetSpy).toHaveBeenCalled();
    expect(writeContractSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        args: ["11", [1n, 0n, 0n], [2n, 0n, 0n], [0n, 0n, 0n]],
        value: parseEther("1.25"),
      }),
    );
    expect(writeContractSpy.mock.calls[0]?.[0]).not.toHaveProperty("gas");
  });
});
