import { Player } from './player';
import { getPlayerName } from './utils/playerName';
import { getPlayerTypeIcon, getPlayerTypeColor } from './utils/playerType';
import FootballPlayerAvatar from './avatar/FootballPlayerAvatar';

type PositionProps = {
    positionName: string;
    teamColour: string;
    index: number;
    player: Player | null;
    onPositionClick: (index: number) => void;
};

const Position = ({ positionName, teamColour, index, player, onPositionClick }: PositionProps) => {
  return (
    <div
      className={`position ${player ? 'filled' : 'empty'}`}
      onClick={() => player && onPositionClick(index)}
      style={{
        cursor: player ? 'pointer' : 'default',
        borderColor: player ? teamColour : '#555',
      }}
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
                  secondaryKitColor: '#ffffff',
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
            <span>ATT <strong>{player.attack.toString()}</strong></span>
            <span>DEF <strong>{player.defense.toString()}</strong></span>
          </div>
          <div className="click-hint">Click to remove</div>
        </div>
      ) : (
        <div className="empty-position">
          <span className="position-name">{positionName}</span>
          <span className="empty-hint">Empty</span>
        </div>
      )}
    </div>
  );
};

export default Position;
