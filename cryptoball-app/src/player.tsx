import { useDrag } from 'react-dnd';
import { getPlayerName } from './playerName';
import { getPlayerTypeIcon, getPlayerTypeName, getPlayerTypeColor } from './playerType';

export type Player = {
    id: bigint;
    originalAttack: bigint;
    attack: bigint;
    originalDefense: bigint;
    defense: bigint;
    potential: bigint;
    gamesLeft: bigint;
    goalsScored: bigint;
    playerType: bigint;
};

type PlayerCardProps = {
    player: Player;
};

const PlayerCard = ({ player }: PlayerCardProps) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'PLAYER',
        item: player,
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const playerTypeColor = getPlayerTypeColor(player.playerType);

    return (
        <div
            ref={drag}
            className="player"
            style={{
                opacity: isDragging ? 0.5 : 1,
                backgroundColor: isDragging ? '#f0f0f0' : '#222',
                color: isDragging ? '#333' : '#eee',
                border: isDragging ? '1px dashed #999' : '1px solid #ddd',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{getPlayerName(player.id)}</span>
                <span 
                    style={{ 
                        backgroundColor: playerTypeColor,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '0.85em',
                        fontWeight: 'bold',
                        color: '#000'
                    }}
                    title={getPlayerTypeName(player.playerType)}
                >
                    {getPlayerTypeIcon(player.playerType)}
                </span>
            </div>
            <div className="player-info">
                <p className="player-attack">Att: <span>{player.attack.toString()}</span></p>
                <p className="player-defense">Def: <span>{player.defense.toString()}</span></p>
                <p className="player-potential">Pot: <span>{player.potential.toString()}</span></p>
            </div>
        </div>
    );
};

export default PlayerCard;
