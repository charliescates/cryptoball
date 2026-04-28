import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Ears, Head } from "./Head";
import { SKIN_TONES } from "../../avatar/avatarTypes";

describe("Head", () => {
  it("renders the supported face shapes and ear variants", () => {
    const { container } = render(
      <svg>
        <Head faceShape="oval" tones={SKIN_TONES.medium} />
        <Head faceShape="square" tones={SKIN_TONES.medium} />
        <Head faceShape="slim" tones={SKIN_TONES.medium} />
        <Head faceShape="round" tones={SKIN_TONES.medium} />
        <Head faceShape="diamond" tones={SKIN_TONES.medium} />
        <Head faceShape="heart" tones={SKIN_TONES.medium} />
        <Head faceShape="long" tones={SKIN_TONES.medium} />
        <Ears faceShape="oval" tones={SKIN_TONES.medium} />
        <Ears faceShape="square" tones={SKIN_TONES.medium} />
        <Ears faceShape="slim" tones={SKIN_TONES.medium} />
        <Ears faceShape="round" tones={SKIN_TONES.medium} />
        <Ears faceShape="diamond" tones={SKIN_TONES.medium} />
        <Ears faceShape="heart" tones={SKIN_TONES.medium} />
        <Ears faceShape="long" tones={SKIN_TONES.medium} />
      </svg>,
    );

    expect(container.querySelectorAll("path").length).toBeGreaterThan(0);
    expect(container.querySelectorAll("ellipse").length).toBeGreaterThan(0);
  });
});
