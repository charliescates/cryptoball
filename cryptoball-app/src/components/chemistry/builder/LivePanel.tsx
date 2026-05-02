import type { TeamStats } from "../../utils/chemistryCalculator";
import { roleCards } from "../data";

interface LivePanelProps {
  nearMisses: string[];
  teamStats: TeamStats;
}

const LivePanel = ({ nearMisses, teamStats }: LivePanelProps) => (
  <aside className="chemistry-live-panel" aria-label="Active chemistry bonuses">
    <div className="chemistry-live-card">
      <span>Active bonuses</span>
      {teamStats.activeChemistryBonuses.length > 0 ? (
        <ul>
          {teamStats.activeChemistryBonuses.map((bonus) => (
            <li key={bonus.description}>
              <strong>{bonus.description}</strong>
              <small>{formatBonusSummary(bonus.attackBonus, bonus.defenseBonus)}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p>No chemistry combo is active yet.</p>
      )}
    </div>
    <div className="chemistry-live-card">
      <span>Coach tip</span>
      <ul>
        {nearMisses.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
    <div className="chemistry-live-card">
      <span>Role colors</span>
      <div className="chemistry-role-chips">
        {roleCards.map((role) => (
          <span key={role.title} style={{ borderColor: role.color, color: role.color }}>
            {role.shorthand} {role.title}
          </span>
        ))}
      </div>
    </div>
  </aside>
);

const formatBonusSummary = (attackBonus: number, defenseBonus: number) =>
  [attackBonus > 0 ? `+${attackBonus}% Attack` : undefined, defenseBonus > 0 ? `+${defenseBonus}% Defense` : undefined]
    .filter(Boolean)
    .join(" / ");

export default LivePanel;
