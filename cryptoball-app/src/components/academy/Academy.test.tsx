import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Academy from "./Academy";

const depositSpy = vi.fn();
const extractSpy = vi.fn();

vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useReadContract: vi.fn(),
}));

vi.mock("react-dnd", () => ({
  DndProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("react-dnd-html5-backend", () => ({
  HTML5Backend: {},
}));

vi.mock("../actions/deposit", () => ({
  Deposit: () => {
    depositSpy();
    return <div>Deposit</div>;
  },
}));

vi.mock("../actions/extract", () => ({
  Extract: () => {
    extractSpy();
    return <div>Extract</div>;
  },
}));

vi.mock("./PlayerCard", () => ({
  PlayerCard: ({ player }: { player: { id: bigint } }) => <div>Player {player.id.toString()}</div>,
}));

const { useAccount, useReadContract } = await import("wagmi");
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

type MockAccount = {
  address?: string;
  isConnected: boolean;
};

type MockReadContractResult = {
  data: unknown;
  error?: Error;
};

describe("Academy", () => {
  afterEach(() => {
    consoleErrorSpy.mockClear();
  });

  it("shows the owner tools and player cards for the owner wallet", () => {
    vi.mocked(useAccount).mockReturnValue({
      address: "0x05B665d3Ba0a83f5259C114fA3F2d2ECD8A00B29",
      isConnected: true,
    } as MockAccount as never);
    vi.mocked(useReadContract).mockReturnValue({
      data: [{ id: 1n }, { id: 2n }],
      error: undefined,
    } as MockReadContractResult as never);

    render(<Academy />);

    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("Extract")).toBeInTheDocument();
    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("Player 2")).toBeInTheDocument();
  });

  it("shows an error when the academy read fails", () => {
    vi.mocked(useAccount).mockReturnValue({ address: "0x123", isConnected: true } as MockAccount as never);
    vi.mocked(useReadContract).mockReturnValue({
      data: undefined,
      error: new Error("boom"),
    } as MockReadContractResult as never);

    render(<Academy />);

    expect(screen.getByText("Error loading players.")).toBeInTheDocument();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to fetch players:", expect.any(Error));
  });
});
