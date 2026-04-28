type PlayerAvatarProps = {
  seed: string;
  size?: number;
  primaryColor?: string;
};

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const pick = <T,>(items: T[], seed: number): T => {
  return items[seed % items.length];
};

export default function PlayerAvatar({
  seed,
  size = 250,
  primaryColor = "#51cf66",
}: PlayerAvatarProps) {
  const hashed = hashString(seed);

  const skinTone = pick(["light", "tan", "brown", "dark"], hashed + 1);
  const face = pick(["face1", "face2", "face3", "face4"], hashed + 2);
  const hair = pick(["hair1", "hair2", "hair3", "hair4"], hashed + 3);
  const boots = pick(["boots-black", "boots-white", "boots-red"], hashed + 4);

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          bottom: 12,
          width: "60%",
          height: 24,
          borderRadius: "999px",
          background: "rgba(0,0,0,0.28)",
          filter: "blur(10px)",
        }}
      />

      <img
        src={`/player-layers/body-${skinTone}.png`}
        alt=""
        draggable={false}
        style={layerStyle}
      />
      <img
        src={`/player-layers/kit-base.png`}
        alt=""
        draggable={false}
        style={{
          ...layerStyle,
          filter: `drop-shadow(0 10px 14px rgba(0,0,0,0.25))`,
        }}
      />
      <img
        src={`/player-layers/kit-overlay-${primaryColor.replace("#", "")}.png`}
        alt=""
        draggable={false}
        style={layerStyle}
      />
      <img
        src={`/player-layers/faces/${face}.png`}
        alt=""
        draggable={false}
        style={layerStyle}
      />
      <img
        src={`/player-layers/hair/${hair}.png`}
        alt=""
        draggable={false}
        style={layerStyle}
      />
      <img
        src={`/player-layers/boots/${boots}.png`}
        alt=""
        draggable={false}
        style={layerStyle}
      />
    </div>
  );
}

const layerStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "contain",
  pointerEvents: "none",
  userSelect: "none",
};