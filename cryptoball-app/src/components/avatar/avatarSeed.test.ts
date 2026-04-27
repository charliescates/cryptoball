import { describe, expect, it } from "vitest";

import { buildTraitsFromSeed, hashString } from "./avatarSeed";

describe("avatarSeed", () => {
  it("produces stable hashes for identical input", () => {
    expect(hashString("alpha")).toBe(hashString("alpha"));
    expect(hashString("alpha")).not.toBe(hashString("beta"));
  });

  it("allows trait overrides on top of the seeded defaults", () => {
    const traits = buildTraitsFromSeed("alpha", {
      facialHairStyle: "beard",
      hairColor: "#123456",
      primaryKitColor: "#abcdef",
    });

    expect(traits.facialHairStyle).toBe("beard");
    expect(traits.hairColor).toBe("#123456");
    expect(traits.primaryKitColor).toBe("#abcdef");
    expect(traits.faceShape).toBeTruthy();
  });
});
