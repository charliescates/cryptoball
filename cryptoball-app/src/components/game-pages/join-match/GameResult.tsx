import type { GameResultScore } from "./types";

interface GameResultProps {
  result: GameResultScore;
}

const GameResult = ({ result }: GameResultProps) => (
  <div className="game-result">
    <h2>Game Result</h2>
    <div className="score">
      <span className="home-score">{result.homeScore}</span>
      <span className="separator">-</span>
      <span className="away-score">{result.awayScore}</span>
    </div>
  </div>
);

export default GameResult;
