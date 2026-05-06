import { isAddress, keccak256, type Hex } from "viem";

import type { BodyStyle, KitStyle, PlayerAvatarTraits } from "../avatar/avatarTypes";

type TeamKitTraits = Pick<PlayerAvatarTraits, "bodyStyle" | "kitStyle" | "primaryKitColor" | "secondaryKitColor">;

const BODY_STYLES: BodyStyle[] = ["athletic", "broad", "slim"];
const KIT_STYLES: KitStyle[] = ["plain", "stripe", "sash"];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const readHashValue = (hash: string, offset: number, length = 8) => Number(BigInt(`0x${hash.slice(offset, offset + length)}`));

const toHex = (value: number) => Math.round(value).toString(16).padStart(2, "0");

const hslToHex = (hue: number, saturation: number, lightness: number) => {
  const h = ((hue % 360) + 360) % 360;
  const s = clamp(saturation, 0, 100) / 100;
  const l = clamp(lightness, 0, 100) / 100;

  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - chroma / 2;

  const [rPrime, gPrime, bPrime] =
    h < 60
      ? [chroma, x, 0]
      : h < 120
        ? [x, chroma, 0]
        : h < 180
          ? [0, chroma, x]
          : h < 240
            ? [0, x, chroma]
            : h < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];

  const r = (rPrime + m) * 255;
  const g = (gPrime + m) * 255;
  const b = (bPrime + m) * 255;

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const getTeamKitTraitsFromAddress = (address?: string): TeamKitTraits | undefined => {
  if (!address || !isAddress(address)) {
    return undefined;
  }

  const hash = keccak256(address as Hex);
  const styleSeed = readHashValue(hash, 2);
  const hueSeed = readHashValue(hash, 10);
  const satSeed = readHashValue(hash, 18);
  const lightSeed = readHashValue(hash, 26);
  const schemeSeed = readHashValue(hash, 34);
  const secondarySatSeed = readHashValue(hash, 42);
  const secondaryLightSeed = readHashValue(hash, 50);

  const primaryHue = hueSeed % 360;
  const primarySaturation = 58 + (satSeed % 33);
  const primaryLightness = 34 + (lightSeed % 22);

  const hueShift = schemeSeed % 3 === 0 ? 180 : schemeSeed % 3 === 1 ? (schemeSeed % 2 === 0 ? 28 : -28) : 120;
  const secondaryHue = primaryHue + hueShift;
  const secondarySaturation = 18 + (secondarySatSeed % 44);
  const secondaryLightness = 72 + (secondaryLightSeed % 20);

  return {
    bodyStyle: BODY_STYLES[styleSeed % BODY_STYLES.length],
    kitStyle: KIT_STYLES[(styleSeed >> 3) % KIT_STYLES.length],
    primaryKitColor: hslToHex(primaryHue, primarySaturation, primaryLightness),
    secondaryKitColor: hslToHex(secondaryHue, secondarySaturation, secondaryLightness),
  };
};
