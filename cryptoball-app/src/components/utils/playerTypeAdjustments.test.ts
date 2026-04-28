import { describe, expect, it } from "vitest";

import { getPlayerTypeAdjustment } from "./playerTypeAdjustments";

describe("playerTypeAdjustments", () => {
  it("returns the expected attack and defense adjustments", () => {
    expect(getPlayerTypeAdjustment(0, true, false, true)).toBe(5);
    expect(getPlayerTypeAdjustment(0, false, true, false)).toBe(10);
    expect(getPlayerTypeAdjustment(1, true, false, true)).toBe(10);
    expect(getPlayerTypeAdjustment(2, false, false, true)).toBe(10);
    expect(getPlayerTypeAdjustment(3, false, true, false)).toBe(10);
  });
});
