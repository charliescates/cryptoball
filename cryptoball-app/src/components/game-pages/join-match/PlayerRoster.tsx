import type { Player } from "../../player";
import { getPlayerName } from "../../utils/playerName";
import { getPlayerTypeColor, getPlayerTypeIcon, getPlayerTypeName } from "../../utils/playerType";
import type { FormationRole } from "./useFormationBuilder";

interface PlayerRosterProps {
  activePositionLabel?: string;
  activePositionRole?: FormationRole | null;
  players: Player[];
  selectedCount: number;
  selectedPlayerIds: Set<bigint>;
  onPlayerClick: (player: Player) => void;
}

const PlayerRoster = ({
  activePositionLabel = "next empty slot",
  activePositionRole = null,
  players,
  selectedCount,
  selectedPlayerIds,
  onPlayerClick,
}: PlayerRosterProps) => (
  <div className="player-roster">
    <div className="player-roster-header">
      <div>
        <p className="join-flow-kicker">Available players</p>
        <h3>Your Players</h3>
      </div>
      <p className="formation-info">Selected: {selectedCount} / 5</p>
    </div>
    <p className="player-roster-instruction">Now filling: {activePositionLabel}</p>
    {players.length === 0 ? (
      <p className="no-players">No players available. Visit the Academy to get players!</p>
    ) : (
      <div className="player-list">
        {players.map((player) => (
          <RosterPlayerCard
            key={player.id.toString()}
            activePositionRole={activePositionRole}
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
  activePositionRole: FormationRole | null;
  isSelected: boolean;
  player: Player;
  onClick: (player: Player) => void;
}

const RosterPlayerCard = ({ activePositionRole, isSelected, player, onClick }: RosterPlayerCardProps) => {
  const playerTypeColor = getPlayerTypeColor(player.playerType);
  const primaryStat =
    activePositionRole === "defense"
      ? player.defense
      : activePositionRole === "midfield"
        ? player.potential
        : player.attack;
  const primaryLabel =
    activePositionRole === "defense" ? "DEF fit" : activePositionRole === "midfield" ? "MID fit" : "ATT fit";

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
        {isSelected ? (
          <span className="selected-badge">Selected</span>
        ) : (
          <span className="fit-badge">
            {primaryLabel} {primaryStat.toString()}
          </span>
        )}
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
