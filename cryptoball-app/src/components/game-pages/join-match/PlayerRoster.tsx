import type { Player } from "../../player";
import { getPlayerName } from "../../utils/playerName";
import { getPlayerTypeColor, getPlayerTypeIcon, getPlayerTypeName } from "../../utils/playerType";

interface PlayerRosterProps {
  players: Player[];
  selectedCount: number;
  selectedPlayerIds: Set<bigint>;
  onPlayerClick: (player: Player) => void;
}

const PlayerRoster = ({ players, selectedCount, selectedPlayerIds, onPlayerClick }: PlayerRosterProps) => (
  <div className="player-roster">
    <h3>Your Players</h3>
    <p className="formation-info">Selected: {selectedCount} / 5</p>
    {players.length === 0 ? (
      <p className="no-players">No players available. Visit the Academy to get players!</p>
    ) : (
      <div className="player-list">
        {players.map((player) => (
          <RosterPlayerCard
            key={player.id.toString()}
            isSelected={selectedPlayerIds.has(player.id)}
            player={player}
            onClick={onPlayerClick}
          />
        ))}
      </div>
    )}
  </div>
);

interface RosterPlayerCardProps {
  isSelected: boolean;
  player: Player;
  onClick: (player: Player) => void;
}

const RosterPlayerCard = ({ isSelected, player, onClick }: RosterPlayerCardProps) => {
  const playerTypeColor = getPlayerTypeColor(player.playerType);

  return (
    <button
      className={`player-card-small ${isSelected ? "selected" : ""}`}
      onClick={() => onClick(player)}
      style={{ position: "relative", textAlign: "left" }}
      type="button"
    >
      <span
        style={{
          position: "absolute",
          top: "4px",
          right: "4px",
          backgroundColor: playerTypeColor,
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: "0.85em",
          fontWeight: "bold",
          color: "#000",
          display: "inline-block",
          lineHeight: "1",
        }}
        title={getPlayerTypeName(player.playerType)}
      >
        {getPlayerTypeIcon(player.playerType)}
      </span>
      <div className="player-card-header">
        <strong>{getPlayerName(player.id)}</strong>
        {isSelected && <span className="selected-badge">✓</span>}
      </div>
      <div className="player-stats">
        <span>ATT: {player.attack.toString()}</span>
        <span>DEF: {player.defense.toString()}</span>
        <span>POT: {player.potential.toString()}</span>
      </div>
      <div className="player-games">Games Left: {player.gamesLeft.toString()}</div>
    </button>
  );
};

export default PlayerRoster;
