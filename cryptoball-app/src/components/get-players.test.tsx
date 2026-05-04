import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import GetPlayers from "./get-players";
import type { Player } from "./player";

vi.mock("wagmi", () => ({
  useAccount: vi.fn(),
  useReadContract: vi.fn(),
}));

vi.mock("./players/SquadPlayerCard", () => ({
  default: ({ player, roleFitLabel }: { player: { id: bigint }; roleFitLabel: string }) => (
    <article data-testid="squad-card">
      Player {player.id.toString()} {roleFitLabel}
    </article>
  ),
}));

const { useAccount, useReadContract } = await import("wagmi");

type MockAccount = {
  address?: string;
  isConnected: boolean;
};

const player = (overrides: Partial<Player>): Player => ({
  attack: 50n,
  defense: 50n,
  gamesLeft: 4n,
  goalsScored: 0n,
  id: 1n,
  originalAttack: 50n,
  originalDefense: 50n,
  playerType: 1n,
  potential: 70n,
  ...overrides,
});

describe("GetPlayers", () => {
  it("renders the owned players list", () => {
    vi.mocked(useAccount).mockReturnValue({ address: "0xabc", isConnected: true } as MockAccount as never);
    vi.mocked(useReadContract).mockReturnValue({
      data: [
        player({ attack: 95n, defense: 50n, id: 1n }),
        player({ attack: 45n, defense: 80n, id: 2n, playerType: 3n }),
      ],
    } as never);

    render(<GetPlayers />);

    expect(screen.getByRole("heading", { name: "Squad" })).toBeInTheDocument();
    expect(screen.getByLabelText("Squad summary")).toHaveTextContent("Players2");
    expect(screen.getByText("Player 1 Attack fit").parentElement).toHaveClass("squad-player-grid");
    expect(screen.getByText("Player 2 Defense fit")).toBeInTheDocument();
    expect(screen.getByLabelText("Squad insights")).toHaveTextContent("Defensive depth");
  });

  it("filters and sorts the squad cards", async () => {
    const user = userEvent.setup();

    vi.mocked(useAccount).mockReturnValue({ address: "0xabc", isConnected: true } as MockAccount as never);
    vi.mocked(useReadContract).mockReturnValue({
      data: [
        player({ attack: 35n, defense: 40n, id: 1n, potential: 95n }),
        player({ attack: 85n, defense: 35n, id: 2n, potential: 65n }),
        player({ attack: 48n, defense: 82n, id: 3n, playerType: 3n, potential: 82n }),
      ],
    } as never);

    render(<GetPlayers />);

    await user.selectOptions(screen.getByLabelText("Sort"), "potential");

    expect(screen.getAllByTestId("squad-card").map((card) => card.textContent?.trim().replace(/\s+/g, " "))).toEqual([
      "Player 1 Elite prospect",
      "Player 3 Defense fit",
      "Player 2 Attack fit",
    ]);

    await user.selectOptions(screen.getByLabelText("Filter"), "high-potential");

    expect(screen.getByLabelText("Squad controls")).toHaveTextContent("2of 3 shown");
    expect(screen.getByText("Player 1 Elite prospect")).toBeInTheDocument();
    expect(screen.getByText("Player 3 Defense fit")).toBeInTheDocument();
    expect(screen.queryByText("Player 2 Attack fit")).not.toBeInTheDocument();
  });
});
