import type {
  BrowStyle,
  EyeShape,
  EyeStyle,
  FaceShape,
  FacialHairStyle,
  JawStyle,
  LipStyle,
  MouthStyle,
  NoseStyle,
  SkinTonePalette,
} from "../avatarTypes";
import { getHeadMetrics } from "../avatarGeometry";

export function FacePlanes({
  tones,
  jawStyle,
}: {
  tones: SkinTonePalette;
  jawStyle: JawStyle;
}) {
  const jawPaths = {
    soft: {
      left: "M81 118C84 122 88 125 92.5 126.5",
      right: "M119 118C116 122 112 125 107.5 126.5",
      chin: "M93.5 136C96.5 138.3 103.5 138.3 106.5 136",
    },
    defined: {
      left: "M79 117C82 122 87 126 93 127",
      right: "M121 117C118 122 113 126 107 127",
      chin: "M92.5 136.5C96 140 104 140 107.5 136.5",
    },
    wide: {
      left: "M77.5 117C81.5 121.5 87 125.2 93.5 126.8",
      right: "M122.5 117C118.5 121.5 113 125.2 106.5 126.8",
      chin: "M91.5 136C95.5 138.8 104.5 138.8 108.5 136",
    },
  }[jawStyle];

  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M77 99C79.5 96 82.4 94.5 86 94" stroke={tones.deep} strokeWidth="1.1" opacity={0.18} />
      <path d="M123 99C120.5 96 117.6 94.5 114 94" stroke={tones.deep} strokeWidth="1.1" opacity={0.18} />
      <path d={jawPaths.left} stroke={tones.shadow} strokeWidth="1" opacity={0.14} />
      <path d={jawPaths.right} stroke={tones.shadow} strokeWidth="1" opacity={0.14} />
      <path d={jawPaths.chin} stroke={tones.deep} strokeWidth="1" opacity={0.12} />
    </g>
  );
}

export function Eyes({
  faceShape,
  style,
  eyeShape,
  eyeWidth,
  eyeHeight,
  eyeSpacing,
  browThickness,
  browStyle,
}: {
  faceShape: FaceShape;
  style: EyeStyle;
  eyeShape: EyeShape;
  eyeWidth: number;
  eyeHeight: number;
  eyeSpacing: number;
  browThickness: number;
  browStyle: BrowStyle;
}) {
  const m = getHeadMetrics(faceShape);
  const eyeY = m.eyeY;
  const browY = m.browY;
  const spacing = (eyeSpacing - 1) * 8;
  const leftEyeX = 86 - spacing;
  const rightEyeX = 114 + spacing;
  const leftEyeTransform = `translate(${leftEyeX} ${eyeY}) scale(${eyeWidth} ${eyeHeight}) translate(-86 ${-eyeY})`;
  const rightEyeTransform = `translate(${rightEyeX} ${eyeY}) scale(${eyeWidth} ${eyeHeight}) translate(-114 ${-eyeY})`;
  const browStrokeWidth = 1.05 + (browThickness - 1) * 0.75;

  const browMap = {
    straight: {
      left: `M77 ${browY + 0.8}L92 ${browY + 0.2}`,
      right: `M108 ${browY + 0.2}L123 ${browY + 0.8}`,
    },
    arched: {
      left: `M77 ${browY + 1.2}Q84 ${browY - 3.2} 92 ${browY + 0.2}`,
      right: `M108 ${browY + 0.2}Q116 ${browY - 3.2} 123 ${browY + 1.2}`,
    },
    angled: {
      left: `M76.5 ${browY + 1.5}L91.5 ${browY - 4}`,
      right: `M108.5 ${browY - 4}L123.5 ${browY + 1.5}`,
    },
  };

  const focusedBrowMap = {
    straight: {
      left: `M77 ${browY + 1}L92 ${browY - 1.5}`,
      right: `M108 ${browY - 1.5}L123 ${browY + 1}`,
    },
    arched: {
      left: `M77 ${browY + 1.5}Q84 ${browY - 5} 92 ${browY - 0.5}`,
      right: `M108 ${browY - 0.5}Q116 ${browY - 5} 123 ${browY + 1.5}`,
    },
    angled: {
      left: `M76.5 ${browY + 1.5}L91.5 ${browY - 4}`,
      right: `M108.5 ${browY - 4}L123.5 ${browY + 1.5}`,
    },
  };

  const brows = style === "focused" ? focusedBrowMap[browStyle] : browMap[browStyle];

  const eyeShapes = {
    round: {
      leftWhite: `M77 ${eyeY}C80 ${eyeY - 6.8} 91 ${eyeY - 6.8} 95 ${eyeY}C91 ${eyeY + 6.8} 80 ${eyeY + 6.8} 77 ${eyeY}Z`,
      rightWhite: `M105 ${eyeY}C109 ${eyeY - 6.8} 120 ${eyeY - 6.8} 123 ${eyeY}C120 ${eyeY + 6.8} 109 ${eyeY + 6.8} 105 ${eyeY}Z`,
      irisRx: 4.2,
      irisRy: 4.6,
    },
    almond: {
      leftWhite: `M77 ${eyeY}C80.8 ${eyeY - 6.2} 90.4 ${eyeY - 6.7} 95 ${eyeY}C90.8 ${eyeY + 6.3} 81.2 ${eyeY + 6.3} 77 ${eyeY}Z`,
      rightWhite: `M105 ${eyeY}C109.6 ${eyeY - 6.7} 119.2 ${eyeY - 6.2} 123 ${eyeY}C118.8 ${eyeY + 6.3} 109.2 ${eyeY + 6.3} 105 ${eyeY}Z`,
      irisRx: 3.8,
      irisRy: 4.3,
    },
    narrow: {
      leftWhite: `M77.5 ${eyeY}C81 ${eyeY - 4.6} 90 ${eyeY - 4.8} 94.5 ${eyeY}C90 ${eyeY + 4.8} 81 ${eyeY + 4.6} 77.5 ${eyeY}Z`,
      rightWhite: `M105.5 ${eyeY}C110 ${eyeY - 4.8} 119 ${eyeY - 4.6} 122.5 ${eyeY}C119 ${eyeY + 4.6} 110 ${eyeY + 4.8} 105.5 ${eyeY}Z`,
      irisRx: 3.5,
      irisRy: 3.9,
    },
    hooded: {
      leftWhite: `M77 ${eyeY}C80 ${eyeY - 6.8} 91 ${eyeY - 6.8} 95 ${eyeY}C91 ${eyeY + 6.8} 80 ${eyeY + 6.8} 77 ${eyeY}Z`,
      rightWhite: `M105 ${eyeY}C109 ${eyeY - 6.8} 120 ${eyeY - 6.8} 123 ${eyeY}C120 ${eyeY + 6.8} 109 ${eyeY + 6.8} 105 ${eyeY}Z`,
      irisRx: 4.2,
      irisRy: 4.6,
    },
    monolid: {
      leftWhite: `M77 ${eyeY}C80 ${eyeY - 6.8} 91 ${eyeY - 6.8} 95 ${eyeY}C91 ${eyeY + 6.8} 80 ${eyeY + 6.8} 77 ${eyeY}Z`,
      rightWhite: `M105 ${eyeY}C109 ${eyeY - 6.8} 120 ${eyeY - 6.8} 123 ${eyeY}C120 ${eyeY + 6.8} 109 ${eyeY + 6.8} 105 ${eyeY}Z`,
      irisRx: 4.2,
      irisRy: 4.6,
    },
    upturned: {
      leftWhite: `M77 ${eyeY}C80 ${eyeY - 6.8} 91 ${eyeY - 6.8} 95 ${eyeY}C91 ${eyeY + 6.8} 80 ${eyeY + 6.8} 77 ${eyeY}Z`,
      rightWhite: `M105 ${eyeY}C109 ${eyeY - 6.8} 120 ${eyeY - 6.8} 123 ${eyeY}C120 ${eyeY + 6.8} 109 ${eyeY + 6.8} 105 ${eyeY}Z`,
      irisRx: 4.2,
      irisRy: 4.6,
    },
    downturned: {
      leftWhite: `M77 ${eyeY}C80 ${eyeY - 6.8} 91 ${eyeY - 6.8} 95 ${eyeY}C91 ${eyeY + 6.8} 80 ${eyeY + 6.8} 77 ${eyeY}Z`,
      rightWhite: `M105 ${eyeY}C109 ${eyeY - 6.8} 120 ${eyeY - 6.8} 123 ${eyeY}C120 ${eyeY + 6.8} 109 ${eyeY + 6.8} 105 ${eyeY}Z`,
      irisRx: 4.2,
      irisRy: 4.6,
    },
  }[eyeShape];

  if (style === "smile") {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <g transform={leftEyeTransform}>
          <path d={`M78.5 ${eyeY - 0.5}C82.5 ${eyeY - 4.7} 89.2 ${eyeY - 4.9} 94 ${eyeY - 0.5}`} stroke="#1A1513" strokeWidth="2.6" />
        </g>
        <g transform={rightEyeTransform}>
          <path d={`M106 ${eyeY - 0.5}C110.8 ${eyeY - 4.9} 117.5 ${eyeY - 4.7} 121.5 ${eyeY - 0.5}`} stroke="#1A1513" strokeWidth="2.6" />
        </g>
      </g>
    );
  }

  if (style === "angry") {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M76 ${browY + 0.5}L92 ${browY - 4}`} stroke="#1A1513" strokeWidth={browStrokeWidth + 0.2} />
        <path d={`M108 ${browY - 4}L124 ${browY + 0.5}`} stroke="#1A1513" strokeWidth={browStrokeWidth + 0.2} />
        <g transform={leftEyeTransform}>
          <path d={`M78 ${eyeY + 1}C82 ${eyeY - 2.4} 88.6 ${eyeY - 2.6} 93.5 ${eyeY + 1}`} stroke="#1A1513" strokeWidth="2.5" />
        </g>
        <g transform={rightEyeTransform}>
          <path d={`M106.5 ${eyeY + 1}C111.4 ${eyeY - 2.6} 118 ${eyeY - 2.4} 122 ${eyeY + 1}`} stroke="#1A1513" strokeWidth="2.5" />
        </g>
      </g>
    );
  }

  if (style === "sleepy") {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M78 ${browY + 1}C83 ${browY - 1.5} 88.5 ${browY - 1.5} 93 ${browY + 0.5}`} stroke="#1A1513" strokeWidth={browStrokeWidth - 0.05} />
        <path d={`M107 ${browY + 0.5}C111.5 ${browY - 1.5} 117 ${browY - 1.5} 122 ${browY + 1}`} stroke="#1A1513" strokeWidth={browStrokeWidth - 0.05} />
        <g transform={leftEyeTransform}>
          <path d={`M77.5 ${eyeY + 1}C82 ${eyeY + 4.5} 89 ${eyeY + 4.5} 94.5 ${eyeY + 1}`} stroke="#1A1513" strokeWidth="2.2" />
        </g>
        <g transform={rightEyeTransform}>
          <path d={`M105.5 ${eyeY + 1}C110 ${eyeY + 4.5} 117 ${eyeY + 4.5} 122.5 ${eyeY + 1}`} stroke="#1A1513" strokeWidth="2.2" />
        </g>
      </g>
    );
  }

  if (style === "surprised") {
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M77 ${browY - 1.5}Q84 ${browY - 7} 92 ${browY - 2}`} stroke="#1A1513" strokeWidth={browStrokeWidth} />
        <path d={`M108 ${browY - 2}Q116 ${browY - 7} 123 ${browY - 1.5}`} stroke="#1A1513" strokeWidth={browStrokeWidth} />
        <g transform={leftEyeTransform}>
          <ellipse cx="86" cy={eyeY + 0.2} rx={eyeShapes.irisRx + 1.2} ry={eyeShapes.irisRy + 1.5} fill="#FFFFFF" />
          <ellipse cx="86" cy={eyeY + 0.2} rx={eyeShapes.irisRx} ry={eyeShapes.irisRy} fill="#231815" />
          <circle cx="87.2" cy={eyeY - 1.4} r="1.05" fill="#FFFFFF" />
        </g>
        <g transform={rightEyeTransform}>
          <ellipse cx="114" cy={eyeY + 0.2} rx={eyeShapes.irisRx + 1.2} ry={eyeShapes.irisRy + 1.5} fill="#FFFFFF" />
          <ellipse cx="114" cy={eyeY + 0.2} rx={eyeShapes.irisRx} ry={eyeShapes.irisRy} fill="#231815" />
          <circle cx="115.2" cy={eyeY - 1.4} r="1.05" fill="#FFFFFF" />
        </g>
      </g>
    );
  }

  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <g stroke="#1A1513" strokeWidth={browStrokeWidth}>
        <path d={brows.left} />
        <path d={brows.right} />
      </g>

      <g transform={leftEyeTransform}>
        <path d={eyeShapes.leftWhite} fill="#FFFFFF" />
        <path
          d={`M79 ${eyeY - 3.8}C83.5 ${eyeY - 6.7} 88.5 ${eyeY - 6.7} 93 ${eyeY - 3.8}`}
          stroke="#1A1513"
          strokeWidth="1.1"
          opacity={0.42}
        />
        <ellipse cx="86" cy={eyeY + 0.2} rx={eyeShapes.irisRx + 0.4} ry={eyeShapes.irisRy + 0.4} fill="#1B120F" />
        <ellipse cx="86" cy={eyeY + 0.2} rx={eyeShapes.irisRx - 0.7} ry={eyeShapes.irisRy - 0.7} fill="#231815" />
        <ellipse cx="86" cy={eyeY + 0.2} rx="1.9" ry="2.4" fill="#6B4E37" opacity={0.38} />
        <circle cx="87.2" cy={eyeY - 1.4} r="1.05" fill="#FFFFFF" />
        <circle cx="85.2" cy={eyeY + 0.8} r="0.55" fill="#FFFFFF" opacity={0.72} />
        <circle cx="84.9" cy={eyeY + 0.5} r="0.4" fill="#2A1C15" opacity={0.35} />
      </g>

      <g transform={rightEyeTransform}>
        <path d={eyeShapes.rightWhite} fill="#FFFFFF" />
        <path
          d={`M107 ${eyeY - 3.8}C111.5 ${eyeY - 6.7} 116.5 ${eyeY - 6.7} 121 ${eyeY - 3.8}`}
          stroke="#1A1513"
          strokeWidth="1.1"
          opacity={0.42}
        />
        <ellipse cx="114" cy={eyeY + 0.2} rx={eyeShapes.irisRx + 0.4} ry={eyeShapes.irisRy + 0.4} fill="#1B120F" />
        <ellipse cx="114" cy={eyeY + 0.2} rx={eyeShapes.irisRx - 0.7} ry={eyeShapes.irisRy - 0.7} fill="#231815" />
        <ellipse cx="114" cy={eyeY + 0.2} rx="1.9" ry="2.4" fill="#6B4E37" opacity={0.38} />
        <circle cx="115.2" cy={eyeY - 1.4} r="1.05" fill="#FFFFFF" />
        <circle cx="113.2" cy={eyeY + 0.8} r="0.55" fill="#FFFFFF" opacity={0.72} />
        <circle cx="112.9" cy={eyeY + 0.5} r="0.4" fill="#2A1C15" opacity={0.35} />
      </g>
    </g>
  );
}

export function Nose({
  faceShape,
  tones,
  noseStyle,
  noseWidth,
}: {
  faceShape: FaceShape;
  tones: SkinTonePalette;
  noseStyle: NoseStyle;
  noseWidth: number;
}) {
  const m = getHeadMetrics(faceShape);
  const y = m.noseY;
  const noseTransform = `translate(100 ${y}) scale(${noseWidth} 1) translate(-100 ${-y})`;

  const noseMap = {
    button: {
      bridge: `M100 ${y}C99.5 ${y + 5.5} 99 ${y + 10} 100.5 ${y + 14}`,
      tip: `M97.5 ${y + 17.2}C99.2 ${y + 19} 101.8 ${y + 19} 103.5 ${y + 17.2}`,
    },
    straight: {
      bridge: `M100 ${y}C99.3 ${y + 6} 98.8 ${y + 12.2} 101.2 ${y + 17.5}`,
      tip: `M96.8 ${y + 20}C99.2 ${y + 22.3} 102.2 ${y + 22.3} 104.6 ${y + 20}`,
    },
    broad: {
      bridge: `M100 ${y}C99 ${y + 6} 98.5 ${y + 12.5} 101.5 ${y + 17.5}`,
      tip: `M95.5 ${y + 20}C98.5 ${y + 23} 101.5 ${y + 23} 105 ${y + 20}`,
    },
    pointed: {
      bridge: `M100 ${y}C99.2 ${y + 5.8} 98.7 ${y + 11.5} 101.3 ${y + 16.8}`,
      tip: `M96.5 ${y + 19}C99.2 ${y + 21.5} 101.8 ${y + 21.5} 104.5 ${y + 19}`,
    },
    hooked: {
      bridge: `M100 ${y}C99.5 ${y + 5.5} 99.2 ${y + 11.5} 101.8 ${y + 16.8}`,
      tip: `M96.5 ${y + 19}C99.2 ${y + 21.5} 101.8 ${y + 21.5} 104.5 ${y + 19}`,
    },
  }[noseStyle];

  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" transform={noseTransform}>
      <path d={noseMap.bridge} stroke={tones.shadow} strokeWidth="1.9" opacity={0.55} />
      <path d={noseMap.tip} stroke={tones.deep} strokeWidth="1.5" opacity={0.34} />
    </g>
  );
}

export function Mouth({
  faceShape,
  style,
  tones,
  lipStyle,
  mouthWidth,
  mouthHeight,
  mouthVariant,
}: {
  faceShape: FaceShape;
  style: MouthStyle;
  tones: SkinTonePalette;
  lipStyle: LipStyle;
  mouthWidth: number;
  mouthHeight: number;
  mouthVariant: number;
}) {
  const y = getHeadMetrics(faceShape).mouthY;
  const widthShift = (mouthVariant % 2 === 0 ? 0 : 2.5) + (mouthWidth - 1) * 8;
  const heightShift = (mouthVariant % 3 === 0 ? -1.2 : 0.8) + (mouthHeight - 1) * 3.2;
  const mouthTransform = `translate(${100 + widthShift * 0.12} ${y + heightShift * 0.12}) scale(${mouthWidth} ${mouthHeight}) translate(-100 ${-y})`;
  const left = 90.5 - widthShift * 0.45;
  const right = 109.5 + widthShift * 0.45;

  const upperMap = {
    neutral: [
      `M${left} ${y}C95.8 ${y + 1.4} 104.2 ${y + 1.4} ${right} ${y}`,
      `M${left - 0.5} ${y + 0.4}C95.2 ${y + 2.1} 104.7 ${y + 0.9} ${right + 0.8} ${y - 0.2}`,
      `M${left} ${y}C95.2 ${y + 1.9} 103.7 ${y + 2.3} ${right} ${y + 0.4}`,
    ],
    smirk: [
      `M${left + 0.5} ${y}C96 ${y + 2.9} 103.8 ${y + 2.4} ${right + 1} ${y - 2}`,
      `M${left} ${y + 0.3}C95.7 ${y + 3.4} 103.7 ${y + 2.2} ${right + 1.8} ${y - 1.5}`,
      `M${left + 0.2} ${y - 0.3}C96.5 ${y + 2.1} 103.2 ${y + 3.2} ${right + 1.4} ${y - 2.4}`,
    ],
    smile: [
      `M${left - 0.5} ${y - 2}C95.5 ${y + 5.4} 104.5 ${y + 5.4} ${right + 0.5} ${y - 2}`,
      `M${left - 1.2} ${y - 1.5}C95 ${y + 6.2} 104.2 ${y + 4.8} ${right + 1} ${y - 0.8}`,
      `M${left} ${y - 3}C95.2 ${y + 4.2} 104.8 ${y + 6.5} ${right} ${y - 2.2}`,
    ],
    frown: [
      `M${left - 0.5} ${y + 2}C95.5 ${y - 5} 104.5 ${y - 5} ${right + 0.5} ${y + 2}`,
      `M${left} ${y + 1.8}C95.2 ${y - 4.5} 104.8 ${y - 5.2} ${right + 1} ${y + 1.8}`,
      `M${left + 0.6} ${y + 2.3}C95.8 ${y - 4.2} 104.2 ${y - 5.4} ${right - 0.2} ${y + 2.1}`,
    ],
    open: [
      `M${left - 0.5} ${y - 1}C95.5 ${y + 6.6} 104.5 ${y + 6.6} ${right + 0.5} ${y - 1}`,
      `M${left} ${y - 2}C95.2 ${y + 8} 104.8 ${y + 6.2} ${right} ${y - 1.2}`,
      `M${left + 0.5} ${y - 1.2}C96 ${y + 6.8} 104 ${y + 8.2} ${right - 0.5} ${y - 1}`,
    ],
    grin: [
      `M${left - 0.2} ${y - 1}C95.5 ${y + 6.9} 104.5 ${y + 6.9} ${right + 0.2} ${y - 1}`,
      `M${left} ${y - 2.2}C95.1 ${y + 7.5} 104.8 ${y + 5.9} ${right + 1} ${y - 1.4}`,
      `M${left + 0.6} ${y - 1.2}C96.2 ${y + 6.2} 103.8 ${y + 7.8} ${right - 0.2} ${y - 0.7}`,
    ],
  }[style];

  const lowerMap = {
    thin: [
      `M94 ${y + 3.2}C97 ${y + 4.1} 103 ${y + 4.1} 106 ${y + 3.2}`,
      `M93.5 ${y + 3.3}C96.5 ${y + 4.5} 103.5 ${y + 4.3} 106.4 ${y + 3.3}`,
      `M94.3 ${y + 3.1}C97.1 ${y + 3.9} 102.9 ${y + 4.2} 105.7 ${y + 3.1}`,
    ],
    medium: [
      `M93.5 ${y + 3.8}C97 ${y + 5.2} 103 ${y + 5.2} 106.5 ${y + 3.8}`,
      `M93 ${y + 3.9}C96.6 ${y + 5.5} 103.4 ${y + 5.1} 107 ${y + 3.9}`,
      `M94 ${y + 3.7}C97 ${y + 5.3} 103 ${y + 5.3} 106 ${y + 3.7}`,
    ],
    full: [
      `M93 ${y + 4.5}C97 ${y + 6.6} 103 ${y + 6.6} 107 ${y + 4.5}`,
      `M92.5 ${y + 4.7}C96.8 ${y + 7.4} 103.2 ${y + 7.4} 107.5 ${y + 4.7}`,
      `M93.2 ${y + 4.3}C97 ${y + 6.8} 103 ${y + 6.8} 106.8 ${y + 4.3}`,
    ],
    heart: [
      `M92.5 ${y + 4.5}C95.7 ${y + 7.2} 98 ${y + 7.8} 100 ${y + 5.8}C102 ${y + 7.8} 104.3 ${y + 7.2} 107.5 ${y + 4.5}`,
      `M92 ${y + 4.7}C95.8 ${y + 7.9} 98.2 ${y + 8.1} 100 ${y + 6.1}C101.8 ${y + 8.1} 104.2 ${y + 7.9} 108 ${y + 4.7}`,
      `M93 ${y + 4.4}C96 ${y + 7.1} 98.4 ${y + 7.6} 100 ${y + 5.9}C101.6 ${y + 7.6} 104 ${y + 7.1} 107 ${y + 4.4}`,
    ],
    downturned: [
      `M93.5 ${y + 3.8}C97 ${y + 2.4} 103 ${y + 2.4} 106.5 ${y + 3.8}`,
      `M93 ${y + 3.9}C96.8 ${y + 2.8} 103.2 ${y + 2.2} 107 ${y + 3.9}`,
      `M94 ${y + 4}C97 ${y + 2.5} 103 ${y + 2.5} 106 ${y + 4}`,
    ],
    upturned: [
      `M93.5 ${y + 3.8}C97 ${y + 5.2} 103 ${y + 5.2} 106.5 ${y + 3.8}`,
      `M93 ${y + 3.7}C97 ${y + 4.9} 103 ${y + 5.7} 107 ${y + 3.7}`,
      `M94 ${y + 3.6}C97 ${y + 5.4} 103 ${y + 5.4} 106 ${y + 3.6}`,
    ],
  }[lipStyle];

  const upper = upperMap[mouthVariant % upperMap.length];
  const lower = lowerMap[mouthVariant % lowerMap.length];
  const hasOpenGap = style === "open" || style === "grin" || mouthVariant === 3;

  return (
    <g fill="none" strokeLinecap="round" transform={mouthTransform}>
      <path d={upper} stroke="#6B302A" strokeWidth={2.1 + (mouthHeight - 1) * 0.4} />
      <path d={lower} stroke="#7B3B34" strokeWidth="1.25" opacity={0.34} />
      <path d={`M98.6 ${y - 4.9}C99.2 ${y - 4} 100.8 ${y - 4} 101.4 ${y - 4.9}`} stroke={tones.shadow} strokeWidth="1" opacity={0.2} />
      {hasOpenGap && (
        <path
          d={`M96.7 ${y + 1.6}C98.4 ${y + 3.1} 101.6 ${y + 3.1} 103.3 ${y + 1.6}`}
          stroke="#2B1711"
          strokeWidth="0.95"
          opacity={0.28}
        />
      )}
      {!hasOpenGap && (
        <>
          <ellipse cx="97.8" cy={y + 0.35} rx="0.8" ry="0.55" fill="#2B1711" opacity={0.25} />
          <ellipse cx="102.2" cy={y + 0.35} rx="0.8" ry="0.55" fill="#2B1711" opacity={0.25} />
        </>
      )}
    </g>
  );
}

export function FacialHair({
  faceShape,
  facialHairStyle,
  variant,
}: {
  faceShape: FaceShape;
  facialHairStyle: FacialHairStyle;
  variant: number;
}) {
  const y = getHeadMetrics(faceShape).mouthY;

  if (facialHairStyle === "none") return null;

  const hairVariant = variant % 4;
  const cheekLift = hairVariant % 2 === 0 ? 0 : 1.5;
  const mustacheLift = hairVariant % 3 === 0 ? -0.4 : 0.4;

  if (facialHairStyle === "stubble") {
    return (
      <g
        opacity={0.18}
        stroke="#1F130F"
        strokeWidth={hairVariant % 2 === 0 ? "0.9" : "1"}
        strokeLinecap="round"
        fill="none"
      >
        <path d={`M83 ${y + 6}C88 ${y + 8} 92 ${y + 9} 96 ${y + 10}`} />
        <path d={`M117 ${y + 6}C112 ${y + 8} 108 ${y + 9} 104 ${y + 10}`} />
        <path d={`M85 ${y + 11}C90 ${y + 14} 95 ${y + 15} 100 ${y + 15}`} />
        <path d={`M115 ${y + 11}C110 ${y + 14} 105 ${y + 15} 100 ${y + 15}`} />
        <path d={`M89 ${y + 16}C93 ${y + 18} 107 ${y + 18} 111 ${y + 16}`} />
      </g>
    );
  }

  if (facialHairStyle === "goatee") {
    return (
      <g fill="none" stroke="#1F130F" strokeLinecap="round" opacity={0.22}>
        <path
          d={`M92 ${y + 4}C95 ${y + 2.2} 105 ${y + 2.2} 108 ${y + 4}`}
          strokeWidth="1.1"
        />
        <path
          d={`M93 ${y + 10}C96 ${y + 15 + cheekLift} 104 ${y + 15 + cheekLift} 107 ${y + 10}`}
          strokeWidth="1.7"
        />
        <path
          d={`M95 ${y + 12}C97 ${y + 17} 103 ${y + 17} 105 ${y + 12}`}
          strokeWidth="1.3"
        />
      </g>
    );
  }

  if (facialHairStyle === "mustache") {
    return (
      <g fill="none" stroke="#1F130F" strokeLinecap="round" opacity={0.24}>
        <path
          d={`M92 ${y + 3.8 + mustacheLift}C95 ${y + 1.8 + mustacheLift} 97.5 ${y + 1.8 + mustacheLift} 100 ${y + 3.2 + mustacheLift}`}
          strokeWidth="1.3"
        />
        <path
          d={`M100 ${y + 3.2 + mustacheLift}C102.5 ${y + 1.8 + mustacheLift} 105 ${y + 1.8 + mustacheLift} 108 ${y + 3.8 + mustacheLift}`}
          strokeWidth="1.3"
        />
        <path
          d={`M96.5 ${y + 5.5}C98.2 ${y + 6.3} 101.8 ${y + 6.3} 103.5 ${y + 5.5}`}
          strokeWidth="0.9"
          opacity={0.42}
        />
      </g>
    );
  }

  if (facialHairStyle === "beard") {
    return (
      <g fill="none" stroke="#1F130F" strokeLinecap="round" opacity={0.2}>
        <path
          d={`M89 ${y + 4}C91 ${y + 8} 95 ${y + 10} 100 ${y + 10}C105 ${y + 10} 109 ${y + 8} 111 ${y + 4}`}
          strokeWidth="1.4"
        />
        <path
          d={`M86 ${y + 9}C89 ${y + 18} 94 ${y + 21} 100 ${y + 21}C106 ${y + 21} 111 ${y + 18} 114 ${y + 9}`}
          strokeWidth="2.1"
        />
        <path
          d={`M91 ${y + 18}C94 ${y + 23} 106 ${y + 23} 109 ${y + 18}`}
          strokeWidth="1.7"
        />
      </g>
    );
  }

  if (facialHairStyle === "fullbeard") {
    return (
      <g fill="none" stroke="#1F130F" strokeLinecap="round" opacity={0.24}>
        <path
          d={`M88 ${y + 4}C91 ${y + 7} 95 ${y + 9} 100 ${y + 9}C105 ${y + 9} 109 ${y + 7} 112 ${y + 4}`}
          strokeWidth="1.5"
        />
        <path
          d={`M84 ${y + 8}C87 ${y + 19} 92 ${y + 25} 100 ${y + 25}C108 ${y + 25} 113 ${y + 19} 116 ${y + 8}`}
          strokeWidth="2.4"
        />
        <path
          d={`M89 ${y + 22}C93 ${y + 28} 107 ${y + 28} 111 ${y + 22}`}
          strokeWidth="1.9"
        />
        <path
          d={`M91 ${y + 11}C94 ${y + 15} 96 ${y + 16} 100 ${y + 16}C104 ${y + 16} 106 ${y + 15} 109 ${y + 11}`}
          strokeWidth="1.1"
        />
      </g>
    );
  }

  return null;
}

export function Ears({
  faceShape,
  tones,
}: {
  faceShape: FaceShape;
  tones: SkinTonePalette;
}) {
  const m = getHeadMetrics(faceShape);

  return (
    <g opacity={0.7}>
      <ellipse cx={m.earLeftX + 3} cy="100" rx="3.5" ry="6.5" fill={tones.base} />
      <ellipse cx={m.earRightX - 3} cy="100" rx="3.5" ry="6.5" fill={tones.base} />

      <ellipse
        cx={m.earLeftX + 3}
        cy="100"
        rx="1.1"
        ry="2.4"
        fill={tones.shadow}
        opacity={0.18}
      />

      <ellipse
        cx={m.earRightX - 3}
        cy="100"
        rx="1.1"
        ry="2.4"
        fill={tones.shadow}
        opacity={0.18}
      />
    </g>
  );
}
