import generateName from "../../utils/teamName";

interface MatchPreviewPanelProps {
  awayAddress: string;
  hasReadyFixture: boolean;
  homeAddress: string;
  statusLabel: string;
  wager: string;
}

const MatchPreviewPanel = ({
  awayAddress,
  hasReadyFixture,
  homeAddress,
  statusLabel,
  wager,
}: MatchPreviewPanelProps) => {
  const shortHome = homeAddress ? generateName(homeAddress) : "Assign home wallet";
  const shortAway = awayAddress ? generateName(awayAddress) : "Assign away wallet";

  return (
    <aside className={`match-summary-panel ${hasReadyFixture ? "match-summary-panel-ready" : ""}`}>
      <PanelHeader label="Match preview" title="Fixture Board" />
      <div className="matchup-row">
        <div>
          <span>Home</span>
          <strong>{shortHome}</strong>
        </div>
        <span className="versus-pill">VS</span>
        <div>
          <span>Away</span>
          <strong>{shortAway}</strong>
        </div>
      </div>
      <div className="summary-grid">
        <SummaryCell label="Wager" value={`${wager || "0"} ETH`} />
        <SummaryCell label="Status" value={statusLabel} />
        <SummaryCell label="Chain action" value={hasReadyFixture ? "Ready to submit" : "Waiting on inputs"} />
      </div>
      <div className="start-game-guidance">
        <GuidanceRow step="1" text="Set both wallets for the fixture." />
        <GuidanceRow step="2" text="Choose the shared match stake." />
        <GuidanceRow step="3" text="Create the match and confirm in wallet." />
      </div>
    </aside>
  );
};

const PanelHeader = ({ label, title }: { label: string; title: string }) => (
  <div className="start-game-panel-header">
    <div>
      <span className="section-kicker">{label}</span>
      <h3>{title}</h3>
    </div>
  </div>
);

const SummaryCell = ({ label, value }: { label: string; value: string }) => (
  <div>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const GuidanceRow = ({ step, text }: { step: string; text: string }) => (
  <div className="start-game-guidance-row">
    <span>{step}</span>
    <p>{text}</p>
  </div>
);

export default MatchPreviewPanel;
