import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { Player } from "../../player";
import { useFormationBuilder } from "./useFormationBuilder";

const playerA: Player = {
  id: 1n,
  originalAttack: 10n,
  attack: 10n,
  originalDefense: 7n,
  defense: 7n,
  potential: 70n,
  gamesLeft: 3n,
  goalsScored: 0n,
  playerType: 1n,
};

const playerB: Player = {
  ...playerA,
  id: 2n,
};

const FormationBuilderHarness = () => {
  const builder = useFormationBuilder();

  return (
    <div>
      <div>Selected: {builder.selectedCount}</div>
      <div>Complete: {builder.isFormationComplete ? "yes" : "no"}</div>
      <div>Attackers: {builder.attackingPlayers.map((player) => player.id.toString()).join(",")}</div>
      <button type="button" onClick={() => builder.handlePlayerClick(playerA)}>
        Toggle A
      </button>
      <button type="button" onClick={() => builder.handlePlayerClick(playerB)}>
        Toggle B
      </button>
      <button type="button" onClick={() => builder.handlePositionClick(0)}>
        Clear First
      </button>
      <button type="button" onClick={builder.clearFormation}>
        Clear All
      </button>
      <button type="button" onClick={() => builder.handleFormationChange("1-3-1")}>
        Change Formation
      </button>
    </div>
  );
};

describe("useFormationBuilder", () => {
  it("adds, removes, and clears players without duplicating selections", async () => {
    const user = userEvent.setup();
    render(<FormationBuilderHarness />);

    await user.click(screen.getByRole("button", { name: /toggle a/i }));
    await user.click(screen.getByRole("button", { name: /toggle a/i }));

    expect(screen.getByText("Selected: 0")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /toggle a/i }));
    await user.click(screen.getByRole("button", { name: /toggle b/i }));

    expect(screen.getByText("Selected: 2")).toBeInTheDocument();
    expect(screen.getByText("Attackers: 1,2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear first/i }));

    expect(screen.getByText("Selected: 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear all/i }));

    expect(screen.getByText("Selected: 0")).toBeInTheDocument();
  });

  it("resets selected players when changing formation", async () => {
    const user = userEvent.setup();
    render(<FormationBuilderHarness />);

    await user.click(screen.getByRole("button", { name: /toggle a/i }));
    await user.click(screen.getByRole("button", { name: /change formation/i }));

    expect(screen.getByText("Selected: 0")).toBeInTheDocument();
  });
});
