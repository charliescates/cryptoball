import { Link } from "react-router-dom";

const features = [
  { icon: "🎯", title: "Scout Players", description: "Find the best talents in the Academy" },
  { icon: "⚡", title: "Build Teams", description: "Create formations and strategies" },
  { icon: "🏆", title: "Compete", description: "Play matches and earn rewards" },
];

interface WelcomeSectionProps {
  teamName?: string;
}

const WelcomeSection = ({ teamName }: WelcomeSectionProps) => (
  <div className="welcome-section">
    <div className="welcome-card">
      <div className="welcome-header">
        <h1>Welcome to Futures FC</h1>
        <p className="welcome-subtitle">{teamName ? `${teamName} is ready to rise` : "Start Building Your Legend"}</p>
      </div>

      <div className="welcome-content">
        <div className="empty-state">
          <div className="empty-state-icon">⚽</div>
          <h2>No Squad Yet</h2>
          <p>You do not have any players on your squad. Visit the Academy to scout and recruit talented players.</p>
        </div>

        <div className="cta-section">
          <Link to="/academy" className="cta-button primary">
            <span className="button-icon">🏫</span>
            Visit Academy
          </Link>
          <p className="cta-description">Browse elite players and build your first team</p>
        </div>

        <div className="features-grid">
          {features.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default WelcomeSection;
