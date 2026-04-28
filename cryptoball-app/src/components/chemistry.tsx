import "../index.css";
import { calcSteps, comboRules, quickRules, roleCards } from "./chemistry/data";
import {
  bandStyle,
  bonusCardStyle,
  bonusGridStyle,
  bonusMetaLabelStyle,
  bonusSummaryStyle,
  bonusTextStyle,
  bonusTitleStyle,
  bonusTopRowStyle,
  bulletItemStyle,
  bulletListStyle,
  calloutLabelStyle,
  calloutStyle,
  calloutTextStyle,
  eyebrowStyle,
  gridBandStyle,
  gridReferenceStyle,
  guidelineGridStyle,
  guidelineItemStyle,
  heroStyle,
  leadStyle,
  pageStyle,
  roleCardStyle,
  roleGridStyle,
  roleIconStyle,
  roleNoteStyle,
  rolePositionStyle,
  roleTitleStyle,
  roleTopRowStyle,
  rulesStripStyle,
  sectionHeaderRowStyle,
  sectionHintStyle,
  sectionTitleStyle,
  stepCardStyle,
  stepIndexStyle,
  stepTextStyle,
  stepsGridStyle,
  summaryCardStyle,
  summaryGridStyle,
  summaryLabelStyle,
  summaryTextStyle,
  tierPillStyle,
  tierSixStyle,
  tierThreeStyle,
  titleStyle,
} from "./chemistry/styles";

export default function Chemistry() {
  return (
    <div className="chemistry-page" style={pageStyle}>
      <ChemistryHero />
      <HowItWorksSection />
      <PlayerTypesSection />
      <ChemistryBonusesSection />
      <ReferenceGridSection />
      <QuickRulesSection />
    </div>
  );
}

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

const HowItWorksSection = () => (
  <section style={bandStyle}>
    <h2 style={sectionTitleStyle}>How It Works</h2>
    <div style={stepsGridStyle}>
      {calcSteps.map((step, index) => (
        <div key={step} style={stepCardStyle}>
          <div style={stepIndexStyle}>{index + 1}</div>
          <div style={stepTextStyle}>{step}</div>
        </div>
      ))}
    </div>
  </section>
);

const PlayerTypesSection = () => (
  <section style={bandStyle}>
    <div style={sectionHeaderRowStyle}>
      <h2 style={sectionTitleStyle}>Player Type Reference</h2>
      <div style={sectionHintStyle}>Role colors and strengths</div>
    </div>

    <div style={roleGridStyle}>
      {roleCards.map((role) => (
        <article key={role.title} style={{ ...roleCardStyle, borderColor: role.color }}>
          <div style={roleTopRowStyle}>
            <div style={{ ...roleIconStyle, color: role.color }}>{role.icon}</div>
            <div>
              <h3 style={{ ...roleTitleStyle, color: role.color }}>{role.title}</h3>
              <div style={rolePositionStyle}>{role.position}</div>
            </div>
          </div>

          <ul style={bulletListStyle}>
            {role.bonuses.map((bonus) => (
              <li key={bonus} style={bulletItemStyle}>
                {bonus}
              </li>
            ))}
          </ul>

          <div style={roleNoteStyle}>{role.note}</div>
        </article>
      ))}
    </div>
  </section>
);

const ChemistryBonusesSection = () => (
  <section style={bandStyle}>
    <div style={sectionHeaderRowStyle}>
      <h2 style={sectionTitleStyle}>Chemistry Bonuses</h2>
      <div style={sectionHintStyle}>Stronger bonus first</div>
    </div>

    <div style={bonusGridStyle}>
      {comboRules.map((rule) => (
        <article key={`${rule.tier}-${rule.title}`} style={bonusCardStyle}>
          <div style={bonusTopRowStyle}>
            <div style={{ ...tierPillStyle, ...(rule.tier === "6-Point" ? tierSixStyle : tierThreeStyle) }}>
              {rule.tier}
            </div>
            <div style={bonusSummaryStyle}>{rule.summary}</div>
          </div>
          <div style={bonusTitleStyle}>{rule.title}</div>
          <div style={bonusMetaLabelStyle}>Combination</div>
          <div style={bonusTextStyle}>{rule.combination}</div>
          <div style={bonusMetaLabelStyle}>Positions</div>
          <div style={bonusTextStyle}>{rule.positions}</div>
        </article>
      ))}
    </div>

    <div style={rulesStripStyle}>
      <Callout label="Priority" text="Six-point bonuses are checked before three-point bonuses." />
      <Callout label="Uniqueness" text="Each player can help with only one chemistry bonus." />
      <Callout label="Spacing" text="Each block keeps the same spacing so the page stays easy to scan." />
    </div>
  </section>
);

interface CalloutProps {
  label: string;
  text: string;
}

const Callout = ({ label, text }: CalloutProps) => (
  <div style={calloutStyle}>
    <div style={calloutLabelStyle}>{label}</div>
    <div style={calloutTextStyle}>{text}</div>
  </div>
);

const ReferenceGridSection = () => (
  <section style={bandStyle}>
    <h2 style={sectionTitleStyle}>Reference Grid</h2>
    <div style={gridReferenceStyle}>
      <GridBand color="#f97316" label="Attack" text="[6] Left [7] Center [8] Right" />
      <GridBand color="#38bdf8" label="Midfield" text="[3] Left [4] Center [5] Right" />
      <GridBand color="#14b8a6" label="Defense" text="[0] Left [1] Center [2] Right" />
    </div>
  </section>
);

interface GridBandProps {
  color: string;
  label: string;
  text: string;
}

const GridBand = ({ color, label, text }: GridBandProps) => (
  <div style={{ ...gridBandStyle, borderColor: color }}>
    <strong>{label}</strong>
    <span>{text}</span>
  </div>
);

const QuickRulesSection = () => (
  <section style={bandStyle}>
    <h2 style={sectionTitleStyle}>Quick Rules</h2>
    <div style={guidelineGridStyle}>
      {quickRules.map((rule) => (
        <div key={rule} style={guidelineItemStyle}>
          {rule}
        </div>
      ))}
    </div>
  </section>
);
