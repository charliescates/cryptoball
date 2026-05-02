import StartGame from "../actions/playGame";

const StartGamePage = () => {
  return (
    <div className="tab-panel">
      <div className="start-game-section">
        <div className="start-game-hero">
          <div className="start-game-hero-copy">
            <span className="section-kicker">Match setup</span>
            <h2>Start new game</h2>
            <p className="tab-description">
              Pair two wallets, choose the shared stake, and create a fixture ready for squad selection.
            </p>
          </div>
          <div className="start-game-format-pills" aria-label="Match format and mode">
            <div>
              <span>Format</span>
              <strong>1v1</strong>
            </div>
            <div>
              <span>Mode</span>
              <strong>Wager</strong>
            </div>
          </div>
        </div>

        <ol className="start-game-setup-rail" aria-label="Setup steps">
          <li>
            <span>1</span>
            <strong>Wallets</strong>
          </li>
          <li>
            <span>2</span>
            <strong>Stake</strong>
          </li>
          <li>
            <span>3</span>
            <strong>Confirm</strong>
          </li>
        </ol>

        <StartGame />
      </div>
    </div>
  );
};

export default StartGamePage;
