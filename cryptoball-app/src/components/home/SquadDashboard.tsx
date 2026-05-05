import { Link } from "react-router-dom";

import type { Player } from "../player";
import { getPlayerName } from "../utils/playerName";

const dashboardLinks = [
  { to: "/players", icon: "👥", title: "View Squad", description: "Manage your team and player stats" },
  { to: "/academy", icon: "🏫", title: "Academy", description: "Scout and recruit new talent" },
  { to: "/games", icon: "⚽", title: "Matches", description: "Play competitive matches" },
  { to: "/chemistry", icon: "⚡", title: "Chemistry", description: "Analyze team chemistry" },
];

interface SquadDashboardProps {
  players: Player[];
  teamName?: string;
}

const getAverageOverall = (players: Player[]) => {
  if (players.length === 0) return 0;
  const total = players.reduce((sum, player) => sum + Number(player.attack + player.defense) / 2, 0);
  return Math.round(total / players.length);
};

const getBestPlayer = (players: Player[]) =>
  players.reduce<Player | null>((best, player) => {
    if (!best) return player;
    return player.attack + player.defense > best.attack + best.defense ? player : best;
  }, null);

const SquadDashboard = ({ players, teamName }: SquadDashboardProps) => {
  const bestPlayer = getBestPlayer(players);
  const matchReadyCount = players.filter((player) => player.gamesLeft > 0n).length;
  const highPotentialCount = players.filter((player) => player.potential >= 80n).length;
  const nextAction = matchReadyCount >= 5 ? "Build your match five" : "Recruit match-ready depth";

  return (
    <div className="dashboard-section">
      <div className="dashboard-header dashboard-header-upgraded">
        <div>
          <p className="dashboard-kicker">Club overview</p>
          <h1>Your Squad Dashboard</h1>
          {teamName ? <p className="dashboard-team-name">{teamName}</p> : null}
          <p className="dashboard-next-action">{nextAction}</p>
        </div>
        <div className="squad-stats">
          <div className="stat-card">
            <div className="stat-number">{players.length}</div>
            <div className="stat-label">Players</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{getAverageOverall(players)}</div>
            <div className="stat-label">Avg OVR</div>
          </div>
        </div>
      </div>

      <div className="club-overview-grid" aria-label="Club overview">
        <div>
          <span>Best player</span>
          <strong>{bestPlayer ? getPlayerName(bestPlayer.id) : "Scout needed"}</strong>
        </div>
        <div>
          <span>Match ready</span>
          <strong>{matchReadyCount}</strong>
        </div>
        <div>
          <span>Prospects</span>
          <strong>{highPotentialCount}</strong>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-grid">
          {dashboardLinks.map((item) => (
            <Link to={item.to} className="dashboard-card" key={item.to}>
              <div className="card-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SquadDashboard;
