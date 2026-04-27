export type FaceShape = "oval" | "square" | "slim" | "round" | "diamond" | "heart" | "long";
export type HairStyle =
  | "short"
  | "fade"
  | "curly"
  | "ringlets"
  | "buzz"
  | "quiff"
  | "waves"
  | "locs"
  | "mohawk"
  | "afro"
  | "braids"
  | "slickback"
  | "pompadour"
  | "topknot"
  | "cornrows"
  | "flattop"
  | "curtains";
export type EyeStyle = "neutral" | "focused" | "smile" | "angry" | "sleepy" | "surprised";
export type MouthStyle = "neutral" | "smirk" | "smile" | "frown" | "open" | "grin";
export type BodyStyle = "athletic" | "broad" | "slim";
export type KitStyle = "plain" | "stripe" | "sash";
export type SkinTone = "light" | "medium" | "dark" | "tan" | "brown";
export type EyeShape = "round" | "almond" | "narrow" | "hooded" | "monolid" | "upturned" | "downturned";
export type BrowStyle = "straight" | "arched" | "angled";
export type NoseStyle = "button" | "straight" | "broad" | "pointed" | "hooked";
export type LipStyle = "thin" | "medium" | "full" | "heart" | "downturned" | "upturned";
export type JawStyle = "soft" | "defined" | "wide";
export type FacialHairStyle = "none" | "stubble" | "goatee" | "mustache" | "beard" | "fullbeard";

export type PlayerAvatarTraits = {
  faceShape: FaceShape;
  hairStyle: HairStyle;
  eyeStyle: EyeStyle;
  mouthStyle: MouthStyle;
  bodyStyle: BodyStyle;
  kitStyle: KitStyle;
  skinTone: SkinTone;
  hairColor: string;
  primaryKitColor: string;
  secondaryKitColor: string;
  eyeShape: EyeShape;
  eyeWidth: number;
  eyeHeight: number;
  eyeSpacing: number;
  browThickness: number;
  noseWidth: number;
  mouthWidth: number;
  mouthHeight: number;
  mouthVariant: number;
  hairVariant: number;
  facialHairVariant: number;
  browStyle: BrowStyle;
  noseStyle: NoseStyle;
  lipStyle: LipStyle;
  jawStyle: JawStyle;
  facialHairStyle: FacialHairStyle;
};

export type SkinTonePalette = {
  base: string;
  shadow: string;
  blush: string;
  deep: string;
  highlight: string;
};

export const SKIN_TONES: Record<SkinTone, SkinTonePalette> = {
  light: {
    base: "#F2C7A7",
    shadow: "#DAA889",
    blush: "#E8A88D",
    deep: "#B67D62",
    highlight: "#F8D8C3",
  },
  medium: {
    base: "#C88B63",
    shadow: "#A66A49",
    blush: "#BD795B",
    deep: "#845238",
    highlight: "#D89D79",
  },
  dark: {
    base: "#74462D",
    shadow: "#5C331F",
    blush: "#86543B",
    deep: "#422416",
    highlight: "#8D5B3F",
  },
  tan: {
    base: "#D2A679",
    shadow: "#B07552",
    blush: "#C17B5A",
    deep: "#8A5239",
    highlight: "#E3B68B",
  },
  brown: {
    base: "#8B5E3C",
    shadow: "#6A3F24",
    blush: "#7B4A2F",
    deep: "#4E2A1B",
    highlight: "#9C6B45",
  },
};
