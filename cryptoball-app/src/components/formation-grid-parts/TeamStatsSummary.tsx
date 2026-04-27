import type { TeamStats } from "../utils/chemistryCalculator";

interface TeamStatsSummaryProps {
  teamStats: TeamStats;
}

const TeamStatsSummary = ({ teamStats }: TeamStatsSummaryProps) => (
  <div className="team-stats">
    <div className="stat-box">
      <span className="stat-label">Attack</span>
      <span className="stat-value">{teamStats.finalAttack}</span>
    </div>
    <div className="stat-box">
      <span className="stat-label">Defense</span>
      <span className="stat-value">{teamStats.finalDefense}</span>
    </div>
  </div>
);

export default TeamStatsSummary;
