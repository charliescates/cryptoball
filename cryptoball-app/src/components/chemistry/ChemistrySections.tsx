import ChemistryBuilder from "./builder/ChemistryBuilder";
import { calcSteps, comboRules, quickRules, roleCards } from "./data";

const ChemistrySections = () => (
  <>
    <ChemistryBuilder />
    <QuickGuideSection />
    <CombosSection />
    <RolesSection />
    <AdvancedRulesSection />
  </>
);

const QuickGuideSection = () => (
  <section className="chemistry-section chemistry-section--guide">
    <div className="chemistry-section-header">
      <div>
        <p className="chemistry-kicker">Quick Guide</p>
        <h2>Build Chemistry in Four Moves</h2>
      </div>
      <p>Use this when you are picking a squad and want the shortest path to a stronger team.</p>
    </div>

    <div className="chemistry-guide-grid">
      {quickRules.map((rule, index) => (
        <div className="chemistry-guide-card" key={rule}>
          <span>{index + 1}</span>
          <p>{rule}</p>
        </div>
      ))}
    </div>
  </section>
);

const CombosSection = () => (
  <section className="chemistry-section">
    <div className="chemistry-section-header">
      <div>
        <p className="chemistry-kicker">Combos</p>
        <h2>Bonus Reference</h2>
      </div>
      <p>Major combos are checked first. A player can only help one chemistry bonus.</p>
    </div>

    <div className="chemistry-combo-scroll">
      <table className="chemistry-combo-table">
        <caption>Chemistry combo reference</caption>
        <thead>
          <tr>
            <th scope="col">Combo</th>
            <th scope="col">Needs</th>
            <th scope="col">Best slots</th>
            <th scope="col">Bonus</th>
          </tr>
        </thead>
        <tbody>
          {comboRules.map((rule) => (
            <tr key={`${rule.tier}-${rule.title}`}>
              <td>
                <strong>{rule.title}</strong>
                <small>{rule.tier}</small>
              </td>
              <td>{rule.combination}</td>
              <td>{rule.positions}</td>
              <td className={rule.tier === "6-Point" ? "chemistry-major-bonus" : ""}>{rule.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const RolesSection = () => (
  <section className="chemistry-section">
    <div className="chemistry-section-header">
      <div>
        <p className="chemistry-kicker">Roles</p>
        <h2>Player Type Strengths</h2>
      </div>
      <p>Each role has a best home. Put players there first, then adjust for combos.</p>
    </div>

    <div className="chemistry-role-grid">
      {roleCards.map((role) => (
        <article className="chemistry-role-card" key={role.title} style={{ borderColor: role.color }}>
          <div className="chemistry-role-card-top">
            <span style={{ background: `${role.color}22`, borderColor: role.color, color: role.color }}>
              {role.shorthand}
            </span>
            <div>
              <h3 style={{ color: role.color }}>{role.title}</h3>
              <p>{role.position}</p>
            </div>
          </div>
          <div className="chemistry-role-bonuses">
            {role.bonuses.map((bonus) => (
              <span key={bonus}>{bonus}</span>
            ))}
          </div>
          <p className="chemistry-role-note">{role.note}</p>
        </article>
      ))}
    </div>
  </section>
);

const AdvancedRulesSection = () => (
  <section className="chemistry-section">
    <div className="chemistry-section-header">
      <div>
        <p className="chemistry-kicker">Advanced Rules</p>
        <h2>How Final Stats Are Built</h2>
      </div>
      <p>Useful when you want to understand why a squad produced a specific attack or defense number.</p>
    </div>

    <div className="chemistry-advanced-grid">
      {calcSteps.map((step, index) => (
        <div className="chemistry-step-card" key={step}>
          <span>{index + 1}</span>
          <p>{step}</p>
        </div>
      ))}
    </div>
  </section>
);

export default ChemistrySections;
