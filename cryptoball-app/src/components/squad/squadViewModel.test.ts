import { describe, expect, it } from "vitest";

import type { Player } from "../player";
import {
  getOverallRating,
  getRoleFitLabel,
  getSquadInsights,
  getSquadMetrics,
  getVisibleSquadPlayers,
} from "./squadViewModel";

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

describe("squadViewModel", () => {
  it("calculates squad ratings and summary metrics", () => {
    const players = [
      player({ attack: 80n, defense: 60n, id: 1n }),
      player({ attack: 30n, defense: 50n, gamesLeft: 0n, id: 2n }),
    ];

    expect(getOverallRating(players[0])).toBe(70);
    expect(getSquadMetrics(players)).toEqual([
      { helper: "signed to the club", label: "Players", value: "2" },
      { helper: "attack and defense", label: "Avg overall", value: "55" },
      { helper: expect.any(String), label: "Best overall", value: "70" },
      { helper: "with games left", label: "Match ready", value: "1" },
    ]);
  });

  it("sorts and filters visible squad players", () => {
    const players = [
      player({ attack: 30n, defense: 90n, id: 1n, playerType: 3n, potential: 82n }),
      player({ attack: 95n, defense: 40n, id: 2n, playerType: 1n, potential: 72n }),
      player({ attack: 45n, defense: 47n, gamesLeft: 0n, id: 3n, playerType: 2n, potential: 88n }),
    ];

    expect(
      getVisibleSquadPlayers(players, "high-potential", "potential").map((visiblePlayer) => visiblePlayer.id),
    ).toEqual([3n, 1n]);
    expect(getVisibleSquadPlayers(players, "attackers", "attack").map((visiblePlayer) => visiblePlayer.id)).toEqual([
      2n,
    ]);
    expect(getVisibleSquadPlayers(players, "match-ready", "overall").map((visiblePlayer) => visiblePlayer.id)).toEqual([
      2n,
      1n,
    ]);
  });

  it("creates role fit labels and insight cards", () => {
    const players = [
      player({ attack: 75n, defense: 40n, id: 1n, playerType: 1n, potential: 70n }),
      player({ attack: 45n, defense: 74n, id: 2n, playerType: 3n, potential: 90n }),
    ];

    expect(getRoleFitLabel(players[0])).toBe("Attack fit");
    expect(getRoleFitLabel(players[1])).toBe("Elite prospect");
    expect(getSquadInsights(players)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "High ceiling", value: "1 prospect" }),
        expect.objectContaining({ label: "Defensive depth", value: "1 cover option" }),
      ]),
    );
  });
});
