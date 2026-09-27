import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { writeContractMock, useWaitForTransactionReceiptMock, useWriteContractMock } = vi.hoisted(() => ({
  writeContractMock: vi.fn(),
  useWaitForTransactionReceiptMock: vi.fn(),
  useWriteContractMock: vi.fn(),
}));

vi.mock("../../../contracts/tournementContract", () => ({
  tournementContract: {
    address: "0x00000000000000000000000000000000000000aa",
    abi: [],
  },
}));

vi.mock("../../../config/network", () => ({
  activeChain: { id: 31337 },
  nativeTokenSymbol: "POL",
}));

vi.mock("wagmi", () => ({
  useWriteContract: () => useWriteContractMock(),
  useWaitForTransactionReceipt: (args: unknown) => useWaitForTransactionReceiptMock(args),
}));

const { default: CreateTournamentModal } = await import("./CreateTournamentModal");

describe("CreateTournamentModal", () => {
  beforeEach(() => {
    writeContractMock.mockReset();
    useWriteContractMock.mockReset();
    useWaitForTransactionReceiptMock.mockReset();

    useWriteContractMock.mockReturnValue({
      data: undefined,
      error: undefined,
      isPending: false,
      reset: vi.fn(),
      writeContract: writeContractMock,
    });

    useWaitForTransactionReceiptMock.mockReturnValue({
      isLoading: false,
      isSuccess: false,
    });
  });

  it("submits include and exclude chemistry types from multiselect inputs", async () => {
    const user = userEvent.setup();
    render(<CreateTournamentModal />);

    await user.type(screen.getByLabelText(/tournament name/i), "Type Rules Cup");

    const includeGroup = screen.getByRole("group", { name: /include chemistry types/i });
    const excludeGroup = screen.getByRole("group", { name: /exclude chemistry types/i });

    await user.click(within(includeGroup).getByLabelText("Enforcer"));
    await user.click(within(includeGroup).getByLabelText("Playmaker"));
    await user.click(within(excludeGroup).getByLabelText("Enforcer"));

    await user.click(screen.getByRole("button", { name: /create tournament/i }));

    expect(writeContractMock).toHaveBeenCalledTimes(1);
    const payload = writeContractMock.mock.calls[0][0];
    expect(payload.args[7]).toEqual([2]);
    expect(payload.args[8]).toEqual([0]);
  });
});
