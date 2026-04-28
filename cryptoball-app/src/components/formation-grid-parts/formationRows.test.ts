import { describe, expect, it } from "vitest";

import type { Player } from "../player";
import { getFormationGroups } from "./formationRows";

const createPlayer = (id: bigint): Player => ({
  attack: 10n,
  defense: 8n,
  gamesLeft: 5n,
  goalsScored: 0n,
  id,
  originalAttack: 10n,
  originalDefense: 8n,
  playerType: 1n,
  potential: 75n,
});

describe("formationRows", () => {
  it("splits a formation into attack, midfield, and defense groups", () => {
    const groups = getFormationGroups(
      [createPlayer(1n), createPlayer(2n), createPlayer(3n), createPlayer(4n), createPlayer(5n)],
      { attack: 2, defense: 1, midfield: 2, name: "2-2-1" },
    );

    expect(groups.attackPlayers).toHaveLength(2);
    expect(groups.midfieldPlayers).toHaveLength(2);
    expect(groups.defensePlayers).toHaveLength(1);
    expect(groups.attackPlayers[0]?.id).toBe(1n);
    expect(groups.midfieldPlayers[0]?.id).toBe(3n);
    expect(groups.defensePlayers[0]?.id).toBe(5n);
  });
});
