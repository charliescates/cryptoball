import { useId, useMemo } from "react";
import { buildTraitsFromSeed } from "./avatarSeed";
import { SKIN_TONES, type PlayerAvatarTraits } from "./avatarTypes";
import { FootballShirt } from "./parts/FootballShirt";
import { Badge } from "./parts/Badge";
import { Head, Ears } from "./parts/Head";
import { Hair } from "./parts/Hair";
import {
  Eyes,
  FacePlanes,
  FacialHair,
  Mouth,
  Nose,
} from "./parts/FaceFeatures";

type PlayerAvatarProps = {
  seed?: string;
  size?: number;
  traits?: Partial<PlayerAvatarTraits>;
  className?: string;
  showBadge?: boolean;
  badgeText?: string;
};

export default function FootballPlayerAvatar({
  seed = "player-1",
  size = 260,
  traits: traitOverrides,
  className,
  showBadge = false,
  badgeText = "FC",
}: PlayerAvatarProps) {
  const uid = useId().replace(/:/g, "");
  const traits = useMemo(() => buildTraitsFromSeed(seed, traitOverrides), [seed, traitOverrides]);

  const skinTone = traits.skinTone as keyof typeof SKIN_TONES;
  const tones = SKIN_TONES[skinTone] ?? SKIN_TONES.medium;

  return (
    <svg
      viewBox="0 0 200 240"
      width={size}
      height={size * 1.2}
      className={className}
      role="img"
      aria-label="Football player avatar"
    >
      <FootballShirt
        style={traits.bodyStyle}
        primaryKitColor={traits.primaryKitColor}
        secondaryKitColor={traits.secondaryKitColor}
        kitStyle={traits.kitStyle}
        clipId={`${uid}-shirt-clip`}
      />

      <Head faceShape={traits.faceShape} tones={tones} />
      <Ears faceShape={traits.faceShape} tones={tones} />

      <FacePlanes tones={tones} jawStyle={traits.jawStyle} />

      <Eyes
        faceShape={traits.faceShape}
        style={traits.eyeStyle}
        eyeShape={traits.eyeShape}
        eyeWidth={traits.eyeWidth}
        eyeHeight={traits.eyeHeight}
        eyeSpacing={traits.eyeSpacing}
        browThickness={traits.browThickness}
        browStyle={traits.browStyle}
      />

      <Nose
        faceShape={traits.faceShape}
        tones={tones}
        noseStyle={traits.noseStyle}
        noseWidth={traits.noseWidth}
      />

      <Mouth
        faceShape={traits.faceShape}
        style={traits.mouthStyle}
        tones={tones}
        lipStyle={traits.lipStyle}
        mouthWidth={traits.mouthWidth}
        mouthHeight={traits.mouthHeight}
        mouthVariant={traits.mouthVariant}
      />

      <FacialHair
        faceShape={traits.faceShape}
        facialHairStyle={traits.facialHairStyle}
        variant={traits.facialHairVariant}
      />

      <Hair
        faceShape={traits.faceShape}
        style={traits.hairStyle}
        color={traits.hairColor}
        variant={traits.hairVariant}
      />

      {showBadge && <Badge text={badgeText} />}
    </svg>
  );
}
