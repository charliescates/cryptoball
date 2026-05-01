import FootballPlayerAvatar from "./avatar/FootballPlayerAvatar";
import type { Player } from "./player";
import { getPlayerName } from "./utils/playerName";
import { getPlayerTypeColor, getPlayerTypeIcon } from "./utils/playerType";

type PositionProps = {
  positionName: string;
  teamColour: string;
  index: number;
  player: Player | null;
  isActive?: boolean;
  onPositionClick: (index: number) => void;
};

const Position = ({ positionName, teamColour, index, player, isActive = false, onPositionClick }: PositionProps) => {
  return (
    <button
      className={`position ${player ? "filled" : "empty"} ${isActive ? "active" : ""}`}
      onClick={() => onPositionClick(index)}
      style={{
        cursor: "pointer",
        borderColor: player || isActive ? teamColour : "#555",
      }}
      type="button"
    >
      {player ? (
        <div className="position-content">
          <div className="position-header">
            <div
              className="position-avatar"
              style={{
                borderColor: `${getPlayerTypeColor(player.playerType)}66`,
              }}
            >
              <FootballPlayerAvatar
                seed={`${player.id.toString()}-${player.playerType.toString()}`}
                size={52}
                showBadge={false}
                traits={{
                  primaryKitColor: getPlayerTypeColor(player.playerType),
                  secondaryKitColor: "#ffffff",
                }}
              />
            </div>
            <div className="position-title-wrap">
              <strong className="player-name">{getPlayerName(player.id)}</strong>
              <span
                className="position-role-pill"
                style={{
                  backgroundColor: `${getPlayerTypeColor(player.playerType)}18`,
                  color: getPlayerTypeColor(player.playerType),
                }}
              >
                {getPlayerTypeIcon(player.playerType)} {positionName}
              </span>
            </div>
          </div>
          <div className="position-stats">
            <span>
              ATT <strong>{player.attack.toString()}</strong>
            </span>
            <span>
              DEF <strong>{player.defense.toString()}</strong>
            </span>
          </div>
          <div className="click-hint">Click to remove</div>
        </div>
      ) : (
        <div className="empty-position">
          <span className="position-name">{positionName}</span>
          <span className="empty-hint">{isActive ? "Pick a player" : "Tap to fill"}</span>
        </div>
      )}
    </button>
  );
};

export default Position;
