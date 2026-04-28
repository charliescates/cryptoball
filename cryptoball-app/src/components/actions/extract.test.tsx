import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Extract } from "./extract";
import { parseEther } from "viem";

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

describe("Extract", () => {
  it("submits the extract transaction with the requested amount", async () => {
    const user = userEvent.setup();

    render(<Extract />);

    await user.type(screen.getByRole("spinbutton"), "1.5");
    await user.click(screen.getByRole("button", { name: /extract/i }));

    expect(resetSpy).toHaveBeenCalled();
    expect(writeContractSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        args: [parseEther("1.5")],
      }),
    );
  });
});
