import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import GetPlayers from "./get-players";

vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useReadContract: vi.fn(),
}));

vi.mock("./players/SquadPlayerCard", () => ({
  default: ({ player }: { player: { id: bigint } }) => <div>Player {player.id.toString()}</div>,
}));

const { useAccount, useReadContract } = await import("wagmi");

type MockAccount = {
  address?: string;
  isConnected: boolean;
};

describe("GetPlayers", () => {
  it("renders the owned players list", () => {
    vi.mocked(useAccount).mockReturnValue({ address: "0xabc", isConnected: true } as MockAccount as never);
    vi.mocked(useReadContract).mockReturnValue({ data: [{ id: 1n }, { id: 2n }] } as never);

    render(<GetPlayers />);

    expect(screen.getByText("Player 1").parentElement).toHaveClass("squad-player-grid");
    expect(screen.getByText("Player 1")).toBeInTheDocument();
    expect(screen.getByText("Player 2")).toBeInTheDocument();
  });
});
