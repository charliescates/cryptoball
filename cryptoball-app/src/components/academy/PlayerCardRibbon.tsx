import type { CSSProperties } from "react";

interface PlayerCardRibbonProps {
  accentColor: string;
  isHighPotential: boolean;
  playerTypeColor: string;
  playerTypeIcon: string;
  playerTypeName: string;
}

const PlayerCardRibbon = ({
  accentColor,
  isHighPotential,
  playerTypeColor,
  playerTypeIcon,
  playerTypeName,
}: PlayerCardRibbonProps) => (
  <div style={getRibbonStyle({ accentColor, isHighPotential, playerTypeColor })} title={playerTypeName}>
    {playerTypeIcon} {playerTypeName}
  </div>
);

interface RibbonStyleInput {
  accentColor: string;
  isHighPotential: boolean;
  playerTypeColor: string;
}

const getRibbonStyle = ({ accentColor, isHighPotential, playerTypeColor }: RibbonStyleInput): CSSProperties => ({
  position: "absolute",
  top: 12,
  right: -58,
  transform: "rotate(35deg)",
  background: isHighPotential
    ? `linear-gradient(90deg, ${accentColor}, #fff1bf)`
    : `linear-gradient(90deg, ${playerTypeColor}, ${playerTypeColor}cc)`,
  color: "#101010",
  padding: "6px 56px",
  fontSize: "0.62rem",
  fontWeight: 950,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  boxShadow: `0 10px 22px rgba(0,0,0,0.35), 0 0 16px ${playerTypeColor}77`,
  zIndex: 3,
  whiteSpace: "nowrap",
});

export default PlayerCardRibbon;
