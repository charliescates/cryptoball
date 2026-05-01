import { calcSteps, comboRules, quickRules, roleCards } from "./data";
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
  gridBandStyle,
  gridReferenceStyle,
  guidelineGridStyle,
  guidelineItemStyle,
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
  tierPillStyle,
  tierSixStyle,
  tierThreeStyle,
} from "./styles";

const ChemistrySections = () => (
  <>
    <HowItWorksSection />
    <PlayerTypesSection />
    <ChemistryBonusesSection />
    <ReferenceGridSection />
    <QuickRulesSection />
  </>
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

const Callout = ({ label, text }: { label: string; text: string }) => (
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

const GridBand = ({ color, label, text }: { color: string; label: string; text: string }) => (
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

export default ChemistrySections;
