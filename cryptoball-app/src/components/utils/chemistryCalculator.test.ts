import { describe, expect, it } from "vitest";

import type { Player } from "../player";
import { calculateChemistryBonuses } from "./chemistryBonuses";
import { calculateTeamStats } from "./chemistryCalculator";

const createPlayer = (id: bigint, playerType: bigint, attack: bigint, defense: bigint): Player => ({
  attack,
  defense,
  gamesLeft: 5n,
  goalsScored: 0n,
  id,
  originalAttack: attack,
  originalDefense: defense,
  playerType,
  potential: 80n,
});

describe("chemistryCalculator", () => {
  it("detects the strike force chemistry bonus", () => {
    const attackPlayers = [null, createPlayer(1n, 1n, 10n, 5n), createPlayer(2n, 1n, 12n, 6n)];
    const midfieldPlayers = [null, null, createPlayer(3n, 2n, 8n, 7n)];
    const defensePlayers = [null, null, null];

    const result = calculateChemistryBonuses(attackPlayers, midfieldPlayers, defensePlayers);

    expect(result.attackBonus).toBe(6);
    expect(result.defenseBonus).toBe(0);
    expect(result.bonuses[0]?.description).toContain("Strike Force");
  });

  it("detects anchor plus enforcer regardless of defender order", () => {
    const attackPlayers = [null, null, null];
    const midfieldPlayers = [null, null, null];
    const defensePlayers = [createPlayer(4n, 0n, 7n, 10n), createPlayer(5n, 3n, 6n, 11n), null];

    const result = calculateChemistryBonuses(attackPlayers, midfieldPlayers, defensePlayers);

    expect(result.attackBonus).toBe(0);
    expect(result.defenseBonus).toBe(3);
    expect(result.bonuses[0]?.description).toContain("Anchor + Enforcer");
  });

  it("detects midfield playmaker plus anchor regardless of midfielder order", () => {
    const attackPlayers = [null, null, null];
    const midfieldPlayers = [createPlayer(6n, 0n, 9n, 9n), createPlayer(7n, 3n, 9n, 9n), createPlayer(8n, 2n, 9n, 9n)];
    const defensePlayers = [null, null, null];

    const result = calculateChemistryBonuses(attackPlayers, midfieldPlayers, defensePlayers);

    expect(result.attackBonus).toBe(0);
    expect(result.defenseBonus).toBe(3);
    expect(result.bonuses[0]?.description).toContain("Midfield: Playmaker + Anchor");
  });

  it("calculates adjusted team stats without chemistry bonuses", () => {
    const attackPlayers = [null, null, null];
    const midfieldPlayers = [createPlayer(4n, 1n, 10n, 8n), null, null];
    const defensePlayers = [null, null, null];

    const result = calculateTeamStats(attackPlayers, midfieldPlayers, defensePlayers);

    expect(result.baseAttack).toBe(10);
    expect(result.baseDefense).toBe(8);
    expect(result.positionAdjustedAttack).toBe(10);
    expect(result.positionAdjustedDefense).toBe(8);
    expect(result.finalAttack).toBe(10);
    expect(result.finalDefense).toBe(8);
    expect(result.activeChemistryBonuses).toHaveLength(0);
  });
});
