import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { TeamStats } from "../utils/chemistryCalculator";
import BonusBreakdown from "./BonusBreakdown";

const teamStats: TeamStats = {
  activeChemistryBonuses: [
    {
      attackBonus: 6,
      defenseBonus: 0,
      description: "Strike Force",
      playerIndices: [3, 6, 7],
      type: "attack",
    },
  ],
  baseAttack: 30,
  baseDefense: 20,
  chemistryBonusAttack: 6,
  chemistryBonusDefense: 0,
  finalAttack: 42,
  finalDefense: 25,
  playerTypeBonusAttack: 9,
  playerTypeBonusDefense: 5,
  positionAdjustedAttack: 39,
  positionAdjustedDefense: 25,
};

describe("BonusBreakdown", () => {
  it("hides itself when there are no bonuses", () => {
    const emptyStats: TeamStats = {
      ...teamStats,
      activeChemistryBonuses: [],
      playerTypeBonusAttack: 0,
      playerTypeBonusDefense: 0,
    };

    const { container } = render(<BonusBreakdown isOpen={false} onToggle={vi.fn()} teamStats={emptyStats} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("toggles the stats breakdown and active bonuses", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(<BonusBreakdown isOpen={false} onToggle={onToggle} teamStats={teamStats} />);

    await user.click(screen.getByRole("button", { name: /show bonus breakdown/i }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders the detailed breakdown when open", () => {
    render(<BonusBreakdown isOpen={true} onToggle={vi.fn()} teamStats={teamStats} />);

    expect(screen.getByText("Stats Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Strike Force")).toBeInTheDocument();
    expect(screen.getByText("Attack")).toBeInTheDocument();
    expect(screen.getByText("Defense")).toBeInTheDocument();
    expect(screen.getByText(/final: 42/i)).toBeInTheDocument();
  });
});
