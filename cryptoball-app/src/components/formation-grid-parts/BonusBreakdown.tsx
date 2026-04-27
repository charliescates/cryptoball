import type { TeamStats } from "../utils/chemistryCalculator";

interface BonusBreakdownProps {
  isOpen: boolean;
  teamStats: TeamStats;
  onToggle: () => void;
}

const BonusBreakdown = ({ isOpen, teamStats, onToggle }: BonusBreakdownProps) => {
  const hasBonuses =
    teamStats.activeChemistryBonuses.length > 0 ||
    teamStats.playerTypeBonusAttack > 0 ||
    teamStats.playerTypeBonusDefense > 0;

  if (!hasBonuses) {
    return null;
  }

  return (
    <div style={{ marginTop: "15px" }}>
      <button
        onClick={onToggle}
        type="button"
        style={{
          padding: "8px 16px",
          backgroundColor: "#4dabf7",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          fontWeight: "bold",
          width: "100%",
        }}
      >
        {isOpen ? "▼ Hide Bonus Breakdown" : "▶ Show Bonus Breakdown"}
      </button>

      {isOpen && (
        <div
          style={{
            marginTop: "10px",
            padding: "15px",
            backgroundColor: "#1a1a1a",
            borderRadius: "8px",
            border: "1px solid #333",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0", fontSize: "1em", color: "#fff" }}>Stats Breakdown</h3>
          <StatBreakdown
            color="#51cf66"
            label="Attack"
            base={teamStats.baseAttack}
            adjusted={teamStats.positionAdjustedAttack}
            typeBonus={teamStats.playerTypeBonusAttack}
            chemistryBonus={teamStats.chemistryBonusAttack}
            finalValue={teamStats.finalAttack}
          />
          <StatBreakdown
            color="#4dabf7"
            label="Defense"
            base={teamStats.baseDefense}
            adjusted={teamStats.positionAdjustedDefense}
            typeBonus={teamStats.playerTypeBonusDefense}
            chemistryBonus={teamStats.chemistryBonusDefense}
            finalValue={teamStats.finalDefense}
          />
          <ActiveChemistryBonuses teamStats={teamStats} />
        </div>
      )}
    </div>
  );
};

interface StatBreakdownProps {
  adjusted: number;
  base: number;
  chemistryBonus: number;
  color: string;
  finalValue: number;
  label: string;
  typeBonus: number;
}

const StatBreakdown = ({ adjusted, base, chemistryBonus, color, finalValue, label, typeBonus }: StatBreakdownProps) => (
  <div style={{ marginBottom: "15px" }}>
    <h4 style={{ fontSize: "0.9em", color, margin: "5px 0" }}>{label}</h4>
    <div style={{ fontSize: "0.85em", paddingLeft: "10px" }}>
      <div>Base: {base}</div>
      <div>
        Position + Player Type: {adjusted} <span style={{ color }}> (+{typeBonus})</span>
      </div>
      {chemistryBonus > 0 && <div>Chemistry Bonus: +{chemistryBonus}%</div>}
      <div style={{ fontWeight: "bold", marginTop: "5px", color }}>Final: {finalValue}</div>
    </div>
  </div>
);

const ActiveChemistryBonuses = ({ teamStats }: { teamStats: TeamStats }) => {
  if (teamStats.activeChemistryBonuses.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 style={{ fontSize: "0.9em", color: "#ffd43b", margin: "10px 0 5px 0" }}>Active Chemistry Bonuses</h4>
      {teamStats.activeChemistryBonuses.map((bonus) => (
        <div
          key={bonus.description}
          style={{
            padding: "8px",
            marginBottom: "5px",
            backgroundColor: "#2a2a2a",
            borderRadius: "4px",
            borderLeft: `3px solid ${
              bonus.type === "attack" ? "#51cf66" : bonus.type === "defense" ? "#4dabf7" : "#ffd43b"
            }`,
          }}
        >
          <div style={{ fontSize: "0.85em", fontWeight: "bold" }}>{bonus.description}</div>
          <div style={{ fontSize: "0.75em", color: "#aaa", marginTop: "3px" }}>
            {bonus.attackBonus > 0 && <span style={{ color: "#51cf66" }}>+{bonus.attackBonus}% Attack </span>}
            {bonus.defenseBonus > 0 && <span style={{ color: "#4dabf7" }}>+{bonus.defenseBonus}% Defense</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BonusBreakdown;
