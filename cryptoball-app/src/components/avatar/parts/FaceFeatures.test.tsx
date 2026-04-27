import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Ears, Eyes, FacialHair, Mouth, Nose } from "./FaceFeatures";
import { getHeadMetrics } from "../avatarGeometry";
import { SKIN_TONES } from "../avatarTypes";

describe("FaceFeatures", () => {
  it("renders the facial feature variants", () => {
    const metrics = getHeadMetrics("oval");

    const { container: eyesContainer } = render(
      <svg>
        <Eyes
          faceShape="oval"
          style="surprised"
          eyeShape="round"
          eyeWidth={1}
          eyeHeight={1}
          eyeSpacing={1}
          browThickness={1}
          browStyle="straight"
        />
        <Eyes
          faceShape="oval"
          style="smile"
          eyeShape="almond"
          eyeWidth={1}
          eyeHeight={1}
          eyeSpacing={1}
          browThickness={1}
          browStyle="arched"
        />
        <Eyes
          faceShape="oval"
          style="angry"
          eyeShape="narrow"
          eyeWidth={1}
          eyeHeight={1}
          eyeSpacing={1}
          browThickness={1}
          browStyle="angled"
        />
        <Eyes
          faceShape="oval"
          style="sleepy"
          eyeShape="hooded"
          eyeWidth={1}
          eyeHeight={1}
          eyeSpacing={1}
          browThickness={1}
          browStyle="straight"
        />
      </svg>,
    );

    expect(eyesContainer.querySelectorAll("path").length).toBeGreaterThan(0);

    const { container: mouthContainer } = render(
      <svg>
        <Mouth
          faceShape="oval"
          style="open"
          tones={SKIN_TONES.medium}
          lipStyle="full"
          mouthWidth={1}
          mouthHeight={1}
          mouthVariant={3}
        />
        <Mouth
          faceShape="oval"
          style="smile"
          tones={SKIN_TONES.medium}
          lipStyle="thin"
          mouthWidth={1}
          mouthHeight={1}
          mouthVariant={0}
        />
      </svg>,
    );

    expect(mouthContainer.querySelectorAll("path").length).toBeGreaterThan(0);

    const { container: hairContainer } = render(
      <svg>
        <FacialHair faceShape="oval" facialHairStyle="stubble" variant={1} />
        <FacialHair faceShape="oval" facialHairStyle="goatee" variant={2} />
        <FacialHair faceShape="oval" facialHairStyle="mustache" variant={3} />
        <FacialHair faceShape="oval" facialHairStyle="beard" variant={4} />
        <FacialHair faceShape="oval" facialHairStyle="fullbeard" variant={5} />
        <Ears faceShape="oval" tones={SKIN_TONES.medium} />
        <Nose faceShape="oval" tones={SKIN_TONES.medium} noseStyle="broad" noseWidth={1.1} />
      </svg>,
    );

    expect(hairContainer.querySelectorAll("path").length).toBeGreaterThan(0);
    expect(metrics.noseY).toBeGreaterThan(0);
  });
});
