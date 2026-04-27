import StartGame from "../actions/playGame";

const StartGamePage = () => {
  return (
    <div className="tab-panel">
      <div className="start-game-section">
        <div className="start-game-hero">
          <div className="start-game-hero-copy">
            <span className="section-kicker">Games desk</span>
            <h2>Match Control</h2>
            <p className="tab-description">
              Set the fixture, fund the stake, and open a competitive match with a clean on-chain record.
            </p>
            <div className="start-game-highlights" aria-label="Match setup overview">
              <div className="start-game-highlight">
                <span>Queue</span>
                <strong>Private fixture</strong>
              </div>
              <div className="start-game-highlight">
                <span>Entry</span>
                <strong>Equal stake</strong>
              </div>
              <div className="start-game-highlight">
                <span>Finish</span>
                <strong>Wallet confirmation</strong>
              </div>
            </div>
          </div>
          <div className="start-game-status-cluster" aria-label="Match format and mode">
            <div className="start-game-metric">
              <span>Format</span>
              <strong>1v1</strong>
            </div>
            <div className="start-game-metric">
              <span>Mode</span>
              <strong>Wager</strong>
            </div>
          </div>
        </div>
        <StartGame />
      </div>
    </div>
  );
};

export default StartGamePage;
