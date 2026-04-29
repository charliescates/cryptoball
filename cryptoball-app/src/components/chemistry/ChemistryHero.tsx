import {
  eyebrowStyle,
  heroStyle,
  leadStyle,
  summaryCardStyle,
  summaryGridStyle,
  summaryLabelStyle,
  summaryTextStyle,
  titleStyle,
} from "./styles";

const ChemistryHero = () => (
  <section style={heroStyle}>
    <div style={eyebrowStyle}>Rulebook</div>
    <h1 style={titleStyle}>Chemistry System Guide</h1>
    <p style={leadStyle}>
      A quick reference for how player types, placement, and chemistry bonuses work together. Use it while building your
      squad to see what boosts each setup can unlock.
    </p>
    <div style={summaryGridStyle}>
      <SummaryCard
        label="How to read"
        text="Start with player roles, then check bonus tiers, then use the position grid."
      />
      <SummaryCard
        label="Gold highlight"
        text="Players with high potential glow gold. Anchors stay teal so the two roles stay easy to tell apart."
      />
      <SummaryCard
        label="Bonus order"
        text="Six-point combinations resolve before three-point combinations, and each player only counts once."
      />
    </div>
  </section>
);

interface SummaryCardProps {
  label: string;
  text: string;
}

const SummaryCard = ({ label, text }: SummaryCardProps) => (
  <div style={summaryCardStyle}>
    <div style={summaryLabelStyle}>{label}</div>
    <div style={summaryTextStyle}>{text}</div>
  </div>
);

export default ChemistryHero;
