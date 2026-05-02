import type { SquadInsight } from "./squadViewModel";

interface SquadInsightsProps {
  insights: SquadInsight[];
}

const SquadInsights = ({ insights }: SquadInsightsProps) => (
  <section className="squad-insights" aria-label="Squad insights">
    {insights.map((insight) => (
      <article className="squad-insight" key={insight.label}>
        <div>
          <span>{insight.label}</span>
          <strong>{insight.value}</strong>
        </div>
        <p>{insight.detail}</p>
      </article>
    ))}
  </section>
);

export default SquadInsights;
