import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Deposit } from "./deposit";

const writeContractSpy = vi.fn();
const resetSpy = vi.fn();
const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

vi.mock("wagmi", () => ({
  useAccount: vi.fn(() => ({ addresses: ["0xowner"], chainId: 1 })),
  useWaitForTransactionReceipt: vi.fn(() => ({ isLoading: false, isSuccess: false })),
  useWriteContract: vi.fn(() => ({
    data: undefined,
    error: undefined,
    isPending: false,
    reset: resetSpy,
    writeContract: writeContractSpy,
  })),
}));

describe("Deposit", () => {
  it("blocks zero-value deposits", async () => {
    const user = userEvent.setup();

    render(<Deposit />);

    await user.click(screen.getByRole("button", { name: /deposit/i }));

    expect(errorSpy).toHaveBeenCalledWith("Amount must be greater than 0");
    expect(writeContractSpy).not.toHaveBeenCalled();
  });
});
