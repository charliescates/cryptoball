import { describe, expect, it } from "vitest";

import { formatPol, getOverallRating, getPositionFromType } from "./playerUtils";

describe("playerUtils", () => {
  it("computes rating, position, and formatting helpers", () => {
    expect(
      getOverallRating({
        attack: 95n,
        defense: 85n,
        id: 1n,
        potential: 90n,
        value: 0n,
        playerType: 0n,
      }),
    ).toBe(90);

    expect(getPositionFromType(3n)).toBe("CDM");
    expect(getPositionFromType(1n)).toBe("ST");
    expect(formatPol(1234500000000000000n)).toBe("1.2345");
  });
});
