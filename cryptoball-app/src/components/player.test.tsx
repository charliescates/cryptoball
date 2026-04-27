import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PlayerCard from "./player";
import type { Player } from "./player";

const dragSpy = vi.fn();

vi.mock("react-dnd", () => ({
  useDrag: vi.fn(() => [{ isDragging: false }, dragSpy]),
}));

vi.mock("./playerAvatar", () => ({
  default: ({ seed, size }: { seed: string; size: number }) => (
    <div data-seed={seed} data-size={size} data-testid="legacy-avatar" />
  ),
}));

const player: Player = {
  attack: 13n,
  defense: 9n,
  gamesLeft: 5n,
  goalsScored: 2n,
  id: 1n,
  originalAttack: 10n,
  originalDefense: 8n,
  playerType: 1n,
  potential: 88n,
};

describe("legacy PlayerCard", () => {
  it("renders the player summary and avatar", () => {
    render(<PlayerCard player={player} />);

    expect(screen.getByText(/Tammy\s+Harit/)).toBeInTheDocument();
    expect(screen.getByText("Target Man")).toBeInTheDocument();
    expect(screen.getByText("+3")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByTestId("legacy-avatar")).toHaveAttribute("data-seed", "1");
    expect(screen.getByTestId("legacy-avatar")).toHaveAttribute("data-size", "64");
  });
});
