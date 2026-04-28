import { describe, expect, it } from "vitest";

import { getPlayerName } from "./playerName";

describe("playerName", () => {
  it("returns the expected player name for a valid id", () => {
    expect(getPlayerName(1n)).toBe("Tammy  Harit");
  });

  it("returns an empty string for invalid ids", () => {
    expect(getPlayerName(0n)).toBe("");
  });
});
