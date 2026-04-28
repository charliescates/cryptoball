import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AcademyPlayer } from "../utils/playerUtils";
import { PlayerCard } from "./PlayerCard";

interface MockAvatarProps {
  traits: {
    primaryKitColor: string;
  };
}

interface MockBuyPlayerProps {
  accentColor: string;
  playerId: bigint;
  price: bigint;
}

vi.mock("../avatar/FootballPlayerAvatar", () => ({
  default: ({ traits }: MockAvatarProps) => (
    <div data-kit-color={traits.primaryKitColor} data-testid="academy-avatar" />
  ),
}));

vi.mock("../actions/BuyPlayer", () => ({
  BuyPlayer: ({ accentColor, playerId, price }: MockBuyPlayerProps) => (
    <div
      data-accent={accentColor}
      data-player-id={playerId.toString()}
      data-price={price.toString()}
      data-testid="buy-player"
    />
  ),
}));

const player: AcademyPlayer = {
  id: 2n,
  attack: 90n,
  defense: 84n,
  playerType: 2n,
  potential: 96n,
  value: 2500000000000000000n,
};

describe("Academy PlayerCard", () => {
  it("renders rating, stats, value, avatar, and buy action", () => {
    render(<PlayerCard player={player} />);

    expect(screen.getByText("OVR")).toBeInTheDocument();
    expect(screen.getAllByText("90")).toHaveLength(2);
    expect(screen.getByText("Attack")).toBeInTheDocument();
    expect(screen.getByText("Defense")).toBeInTheDocument();
    expect(screen.getByText("Potential")).toBeInTheDocument();
    expect(screen.getByText("2.500 POL")).toBeInTheDocument();
    expect(screen.getByTestId("academy-avatar")).toHaveAttribute("data-kit-color", "#f5c542");
    expect(screen.getByTestId("buy-player")).toHaveAttribute("data-player-id", "2");
    expect(screen.getByTestId("buy-player")).toHaveAttribute("data-price", "2500000000000000000");
  });
});
