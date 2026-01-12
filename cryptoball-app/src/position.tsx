import { Player } from './player';
import { getPlayerName } from './playerName';
import { getPlayerTypeIcon, getPlayerTypeColor } from './playerType';

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <strong className="player-name">{getPlayerName(player.id)}</strong>
            <span 
              style={{ 
                backgroundColor: getPlayerTypeColor(player.playerType),
                padding: '2px 5px',
                borderRadius: '3px',
                fontSize: '0.85em',
                fontWeight: 'bold',
                color: '#000'
              }}
            >
              {getPlayerTypeIcon(player.playerType)}
            </span>
          </div>
          <div className="position-stats">
            <span>ATT: {player.attack.toString()}</span>
            <span>DEF: {player.defense.toString()}</span>
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