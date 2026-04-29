import { fireEvent, render, screen } from "@testing-library/react";
import { parseEther } from "viem";
import { describe, expect, it, vi } from "vitest";

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
    render(<StartGame />);

    fireEvent.change(screen.getByLabelText("Away wallet"), {
      target: { value: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" },
    });
    fireEvent.change(screen.getByLabelText("Wager"), { target: { value: "1.25" } });
    fireEvent.click(screen.getByRole("button", { name: "Start Game" }));

    expect(resetSpy).toHaveBeenCalled();
    expect(writeContractSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        functionName: "createGame",
        args: [
          parseEther("1.25"),
          "0x1234567890abcdef1234567890abcdef12345678",
          "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        ],
      }),
    );
  });
});
