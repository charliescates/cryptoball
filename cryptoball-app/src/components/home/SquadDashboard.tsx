import { Link } from "react-router-dom";

const dashboardLinks = [
  { to: "/players", icon: "👥", title: "View Squad", description: "Manage your team and player stats" },
  { to: "/academy", icon: "🏫", title: "Academy", description: "Scout and recruit new talent" },
  { to: "/games", icon: "⚽", title: "Matches", description: "Play competitive matches" },
  { to: "/chemistry", icon: "⚡", title: "Chemistry", description: "Analyze team chemistry" },
];

interface SquadDashboardProps {
  playerCount: number;
}

const SquadDashboard = ({ playerCount }: SquadDashboardProps) => (
  <div className="dashboard-section">
    <div className="dashboard-header">
      <h1>Your Squad Dashboard</h1>
      <div className="squad-stats">
        <div className="stat-card">
          <div className="stat-number">{playerCount}</div>
          <div className="stat-label">Players</div>
        </div>
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

export default SquadDashboard;
