import StartGame from '../actions/playGame';

const StartGamePage = () => {
    return (
        <div className="tab-panel">
            <div className="start-game-section">
                <h2>Create a New Match</h2>
                <p className="tab-description">
                    Set up a new match by specifying the home and away addresses and the wager amount.
                </p>
                <StartGame />
            </div>
        </div>
    );
};

export default StartGamePage;
