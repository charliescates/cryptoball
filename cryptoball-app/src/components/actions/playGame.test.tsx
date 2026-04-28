import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { parseEther } from "viem";

import StartGame from "./playGame";

const writeContractSpy = vi.fn();
const resetSpy = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: vi.fn(() => ({ address: "0x1234567890abcdef1234567890abcdef12345678" })),
  useWaitForTransactionReceipt: vi.fn(() => ({ isLoading: false, isSuccess: false })),
  useWriteContract: vi.fn(() => ({
    data: undefined,
    error: undefined,
    isPending: false,
    reset: resetSpy,
    writeContract: writeContractSpy,
  })),
}));

describe("StartGame", () => {
  it("submits the game creation transaction", async () => {
    const user = userEvent.setup();

    render(<StartGame />);

    await user.type(screen.getByLabelText("Away wallet"), "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
    await user.clear(screen.getByLabelText("Wager"));
    await user.type(screen.getByLabelText("Wager"), "1.25");
    await user.click(screen.getByRole("button", { name: "Start Game" }));

    expect(resetSpy).toHaveBeenCalled();
    expect(writeContractSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "createGame",
        args: [parseEther("1.25"), "0x1234567890abcdef1234567890abcdef12345678", "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"],
      }),
    );
  });
});
