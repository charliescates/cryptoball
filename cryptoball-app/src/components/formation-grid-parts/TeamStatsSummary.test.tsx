import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { TeamStats } from "../utils/chemistryCalculator";
import TeamStatsSummary from "./TeamStatsSummary";

const teamStats: TeamStats = {
  activeChemistryBonuses: [],
  baseAttack: 30,
  baseDefense: 20,
  chemistryBonusAttack: 0,
  chemistryBonusDefense: 0,
  finalAttack: 42,
  finalDefense: 25,
  playerTypeBonusAttack: 9,
  playerTypeBonusDefense: 5,
  positionAdjustedAttack: 39,
  positionAdjustedDefense: 25,
};

describe("TeamStatsSummary", () => {
  it("renders the final team scores", () => {
    render(<TeamStatsSummary teamStats={teamStats} />);

    expect(screen.getByText("Attack")).toBeInTheDocument();
    expect(screen.getByText("Defense")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
  });
});
