import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BuyPlayer } from "./BuyPlayer";

const writeContractSpy = vi.fn();
const resetSpy = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(() => ({ isLoading: false, isSuccess: false })),
  useWriteContract: vi.fn(() => ({
    data: undefined,
    error: undefined,
    isPending: false,
    reset: resetSpy,
    writeContract: writeContractSpy,
  })),
}));

const { useAccount } = await import("wagmi");

type MockAccount = {
  addresses?: string[];
};

describe("BuyPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits the buy transaction with the connected buyer address", async () => {
    const user = userEvent.setup();
    vi.mocked(useAccount).mockReturnValue({ addresses: ["0xbuyer"] } as MockAccount as never);

    render(<BuyPlayer playerId={7n} price={1000n} />);

    await user.click(screen.getByRole("button", { name: /buy player/i }));

    expect(resetSpy).toHaveBeenCalled();
    expect(writeContractSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        args: ["0xbuyer", 7n],
        value: 1000n,
      }),
    );
  });

  it("does not submit when no wallet address is available", async () => {
    const user = userEvent.setup();
    vi.mocked(useAccount).mockReturnValue({ addresses: [] } as MockAccount as never);

    render(<BuyPlayer playerId={7n} price={1000n} />);

    await user.click(screen.getByRole("button", { name: /buy player/i }));

    expect(resetSpy).toHaveBeenCalled();
    expect(writeContractSpy).not.toHaveBeenCalled();
  });
});
