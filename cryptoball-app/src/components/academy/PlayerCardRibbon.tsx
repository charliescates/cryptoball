import { getRibbonStyle } from "./PlayerCard.styles";

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

export default PlayerCardRibbon;
