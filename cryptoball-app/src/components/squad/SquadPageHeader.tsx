import type { SquadMetric } from "./squadViewModel";

interface SquadPageHeaderProps {
  metrics: SquadMetric[];
}

const SquadPageHeader = ({ metrics }: SquadPageHeaderProps) => (
  <section className="squad-page-header" aria-labelledby="squad-title">
    <div className="squad-page-heading">
      <p className="squad-page-kicker">Club management</p>
      <h1 id="squad-title">Squad</h1>
      <p>Review your players, spot role coverage, and pick who is ready for the next match.</p>
    </div>

    <div className="squad-metric-grid" aria-label="Squad summary">
      {metrics.map((metric) => (
        <div className="squad-metric" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <small>{metric.helper}</small>
        </div>
      ))}
    </div>
  </section>
);

export default SquadPageHeader;
