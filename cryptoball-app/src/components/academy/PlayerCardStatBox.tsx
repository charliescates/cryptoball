import { getFeaturedStatBoxStyle, statBoxStyle, statLabelStyle, statValueStyle } from "./PlayerCard.styles";

interface PlayerCardStatBoxProps {
  label: string;
  value: string;
  tone?: "attack" | "defense";
}

const PlayerCardStatBox = ({ label, value, tone }: PlayerCardStatBoxProps) => (
  <div style={tone ? getFeaturedStatBoxStyle(tone) : statBoxStyle}>
    <div style={statLabelStyle}>{label}</div>
    <div style={statValueStyle}>{value}</div>
  </div>
);

export default PlayerCardStatBox;
