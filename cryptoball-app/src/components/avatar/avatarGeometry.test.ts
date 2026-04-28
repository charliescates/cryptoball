import { describe, expect, it } from "vitest";

import { getHeadMetrics } from "./avatarGeometry";

describe("avatarGeometry", () => {
  it("returns consistent metrics for different face shapes", () => {
    const oval = getHeadMetrics("oval");
    const round = getHeadMetrics("round");

    expect(oval.headWidth).toBe(70);
    expect(round.headWidth).toBe(72);
    expect(round.mouthY).toBeGreaterThan(oval.mouthY - 1);
    expect(round.earLeftX).toBeLessThan(round.earRightX);
  });
});
