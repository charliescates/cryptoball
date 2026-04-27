import type { FaceShape, SkinTonePalette } from "../../avatar/avatarTypes";
import { getHeadMetrics } from "../../avatar/avatarGeometry";

export function Head({
  faceShape,
  tones,
}: {
  faceShape: FaceShape;
  tones: SkinTonePalette;
}) {
  const metrics = getHeadMetrics(faceShape);

  return (
    <g>
      <path d={metrics.headPath} fill={tones.base} />

      {faceShape === "square" && (
        <>
          <path
            d="M80 120C84 124 89 127 94 128"
            stroke={tones.shadow}
            strokeWidth="1"
            strokeLinecap="round"
            opacity={0.08}
            fill="none"
          />
          <path
            d="M120 120C116 124 111 127 106 128"
            stroke={tones.shadow}
            strokeWidth="1"
            strokeLinecap="round"
            opacity={0.08}
            fill="none"
          />
        </>
      )}

      {faceShape === "slim" && (
        <>
          <path
            d="M81 69C86 63 92 60 100 60C108 60 114 63 119 69"
            stroke={tones.highlight}
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity={0.34}
            fill="none"
          />
          <path
            d="M80 109C84 118 89 125 95 129"
            stroke={tones.shadow}
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity={0.11}
            fill="none"
          />
          <path
            d="M120 109C116 118 111 125 105 129"
            stroke={tones.shadow}
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity={0.11}
            fill="none"
          />
          <ellipse cx="81.5" cy="111" rx="6.2" ry="4.2" fill={tones.blush} opacity={0.06} />
          <ellipse cx="118.5" cy="111" rx="6.2" ry="4.2" fill={tones.blush} opacity={0.06} />
        </>
      )}

      {faceShape === "oval" && (
        <>
          <path
            d="M79 70C84 63 91 59 100 59C109 59 116 63 121 70"
            stroke={tones.highlight}
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity={0.36}
            fill="none"
          />
          <path
            d="M81 108C86 114 90 120 92 126"
            stroke={tones.shadow}
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity={0.1}
            fill="none"
          />
          <path
            d="M119 108C114 114 110 120 108 126"
            stroke={tones.shadow}
            strokeWidth="1.1"
            strokeLinecap="round"
            opacity={0.1}
            fill="none"
          />
          <ellipse cx="83" cy="111" rx="7" ry="4.6" fill={tones.blush} opacity={0.08} />
          <ellipse cx="117" cy="111" rx="7" ry="4.6" fill={tones.blush} opacity={0.08} />
        </>
      )}
    </g>
  );
}

export function Ears({
  faceShape,
  tones,
}: {
  faceShape: FaceShape;
  tones: Pick<SkinTonePalette, "base" | "shadow">;
}) {
  const metrics = getHeadMetrics(faceShape);
  const rx =
    faceShape === "round"
      ? 4.1
      : faceShape === "diamond"
        ? 3.7
        : faceShape === "heart"
          ? 3.8
          : faceShape === "long"
            ? 3.3
            : faceShape === "square"
              ? 4.3
              : faceShape === "slim"
                ? 3.5
                : 3.9;
  const ry =
    faceShape === "round"
      ? 7.5
      : faceShape === "diamond"
        ? 7.1
        : faceShape === "heart"
          ? 7.2
          : faceShape === "long"
            ? 7.8
            : faceShape === "square"
              ? 7.4
              : faceShape === "slim"
                ? 6.8
                : 7.2;
  const leftEarX = metrics.earLeftX + rx * 0.6;
  const rightEarX = metrics.earRightX - rx * 0.6;
  const earY = faceShape === "long" ? 101 : 100;

  return (
    <g opacity={0.92}>
      <ellipse
        cx={leftEarX}
        cy={earY}
        rx={rx}
        ry={ry}
        fill={tones.base}
      />
      <ellipse
        cx={rightEarX}
        cy={earY}
        rx={rx}
        ry={ry}
        fill={tones.base}
      />
      <path
        d={`M${leftEarX - 0.2} ${earY - 2}C${leftEarX + 0.8} ${earY} ${leftEarX + 0.8} ${earY + 3} ${leftEarX - 0.7} ${earY + 5}`}
        stroke={tones.shadow}
        strokeWidth="1"
        opacity={0.24}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${leftEarX + 1} ${earY + 2}C${leftEarX + 2} ${earY + 1.2} ${leftEarX + 2} ${earY - 0.2} ${leftEarX + 1} ${earY - 1}`}
        stroke={tones.shadow}
        strokeWidth="0.8"
        opacity={0.18}
        fill="none"
        strokeLinecap="round"
      />

      <path
        d={`M${rightEarX + 0.2} ${earY - 2}C${rightEarX - 0.8} ${earY} ${rightEarX - 0.8} ${earY + 3} ${rightEarX + 0.7} ${earY + 5}`}
        stroke={tones.shadow}
        strokeWidth="1"
        opacity={0.24}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${rightEarX - 1} ${earY + 2}C${rightEarX - 2} ${earY + 1.2} ${rightEarX - 2} ${earY - 0.2} ${rightEarX - 1} ${earY - 1}`}
        stroke={tones.shadow}
        strokeWidth="0.8"
        opacity={0.18}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}
