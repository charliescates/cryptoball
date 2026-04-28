import { describe, expect, it } from "vitest";

import {
  POTENTIAL_GOLD,
  PlayerType,
  getPlayerTypeBonuses,
  getPlayerTypeColor,
  getPlayerTypeDescription,
  getPlayerTypeIcon,
  getPlayerTypeName,
  getPotentialColor,
} from "./playerType";

describe("playerType utilities", () => {
  it("returns the expected labels, icons, and colors", () => {
    expect(getPlayerTypeName(PlayerType.ENFORCER)).toBe("Enforcer");
    expect(getPlayerTypeName(PlayerType.TARGET_MAN)).toBe("Target Man");
    expect(getPlayerTypeIcon(PlayerType.PLAYMAKER)).toBe("⚡");
    expect(getPlayerTypeColor(PlayerType.ANCHOR)).toBe("#14b8a6");
  });

  it("returns potential and bonus details", () => {
    expect(getPotentialColor(90n, "#ffffff")).toBe(POTENTIAL_GOLD);
    expect(getPotentialColor(80n, "#ffffff")).toBe("#ffffff");
    expect(getPlayerTypeDescription(PlayerType.TARGET_MAN)).toContain("attacking specialist");
    expect(getPlayerTypeBonuses(PlayerType.ANCHOR)).toEqual([
      { bonus: "No bonus", position: "Attack" },
      { bonus: "+5% Defense", position: "Midfield" },
      { bonus: "+10% Defense", position: "Defense" },
    ]);
  });
});
