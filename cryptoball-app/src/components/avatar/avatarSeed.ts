import type {
  BodyStyle,
  BrowStyle,
  EyeShape,
  EyeStyle,
  FacialHairStyle,
  FaceShape,
  HairStyle,
  JawStyle,
  KitStyle,
  LipStyle,
  MouthStyle,
  NoseStyle,
  PlayerAvatarTraits,
  SkinTone,
} from "./avatarTypes";

export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 3266489909);
  hash ^= hash >>> 16;
  return Math.abs(hash >>> 0);
}

function pick<T>(items: T[], seedText: string, key: string): T {
  const mixed = hashString(`${seedText}:${key}`);
  return items[mixed % items.length];
}

export function buildTraitsFromSeed(
  seedText: string,
  overrides?: Partial<PlayerAvatarTraits>
): PlayerAvatarTraits {
  const base: PlayerAvatarTraits = {
    faceShape: pick<FaceShape>(
      ["oval", "square", "slim", "round", "diamond", "heart", "long"],
      seedText,
      "faceShape"
    ),
    hairStyle: pick<HairStyle>(
      [
        "short",
        "curly",
        "ringlets",
        "quiff",
        "locs",
        "mohawk",
        "afro",
        "braids",
        "slickback",
        "pompadour",
        "topknot",
        "cornrows",
        "flattop",
        "curtains",
      ],
      seedText,
      "hairStyle"
    ),
    eyeStyle: pick<EyeStyle>(
      ["neutral", "focused", "smile", "angry", "sleepy", "surprised"],
      seedText,
      "eyeStyle"
    ),
    mouthStyle: pick<MouthStyle>(
      ["neutral", "smirk", "smile", "frown", "open", "grin"],
      seedText,
      "mouthStyle"
    ),
    bodyStyle: pick<BodyStyle>(["athletic", "broad", "slim"], seedText, "bodyStyle"),
    kitStyle: pick<KitStyle>(["plain", "stripe", "sash"], seedText, "kitStyle"),
    skinTone: pick<SkinTone>(["light", "medium", "dark", "tan", "brown"], seedText, "skinTone"),
    hairColor: pick(
      [
        "#120E0B",
        "#231815",
        "#34221A",
        "#4E2E20",
        "#6C3E28",
        "#8D5331",
        "#C56B2D",
        "#E0B35A",
        "#D9B8A3",
        "#DAD5D0",
        "#8C7E6F",
        "#4B7BD6",
        "#6F4CCB",
        "#A73BC0",
        "#D24A8F",
        "#5F8F3A",
      ],
      seedText,
      "hairColor"
    ),
    primaryKitColor: pick(
      ["#D81E25", "#1747A6", "#117A42", "#17181B", "#6A23B3"],
      seedText,
      "primaryKitColor"
    ),
    secondaryKitColor: pick(["#FFFFFF", "#FFD84D", "#CBE7FF", "#F4F4F4"], seedText, "secondaryKitColor"),
    eyeShape: pick<EyeShape>(
      ["round", "almond", "narrow", "hooded", "monolid", "upturned", "downturned"],
      seedText,
      "eyeShape"
    ),
    eyeWidth: pick([0.86, 0.94, 1, 1.08, 1.16], seedText, "eyeWidth"),
    eyeHeight: pick([0.84, 0.93, 1, 1.08, 1.16], seedText, "eyeHeight"),
    eyeSpacing: pick([0.86, 0.95, 1, 1.08, 1.16], seedText, "eyeSpacing"),
    browThickness: pick([0.85, 0.98, 1.08, 1.22], seedText, "browThickness"),
    noseWidth: pick([0.88, 0.96, 1, 1.08, 1.16], seedText, "noseWidth"),
    mouthWidth: pick([0.88, 0.96, 1, 1.06, 1.12], seedText, "mouthWidth"),
    mouthHeight: pick([0.82, 0.92, 1, 1.08, 1.18], seedText, "mouthHeight"),
    mouthVariant: pick([0, 1, 2, 3], seedText, "mouthVariant"),
    hairVariant: pick([0, 1, 2, 3, 4, 5, 6, 7], seedText, "hairVariant"),
    facialHairVariant: pick([0, 1, 2, 3], seedText, "facialHairVariant"),
    browStyle: pick<BrowStyle>(["straight", "arched", "angled"], seedText, "browStyle"),
    noseStyle: pick<NoseStyle>(
      ["button", "straight", "broad", "pointed", "hooked"],
      seedText,
      "noseStyle"
    ),
    lipStyle: pick<LipStyle>(
      ["thin", "medium", "full", "heart", "downturned", "upturned"],
      seedText,
      "lipStyle"
    ),
    jawStyle: pick<JawStyle>(["soft", "defined", "wide"], seedText, "jawStyle"),
    facialHairStyle: pick<FacialHairStyle>(
      ["none", "stubble", "goatee", "mustache", "beard", "fullbeard"],
      seedText,
      "facialHairStyle"
    ),
  };

  return { ...base, ...overrides };
}
