import { useDrag } from 'react-dnd';
import { getPlayerName } from './playerName';

export type Player = {
    id: bigint;
    attack: bigint;
    defense: bigint;
    potential: bigint;
    gamesLeft: bigint;
    goalsScored: bigint;
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
            {getPlayerName(player.id)}
            <div className="player-info">
                <p className="player-attack">Att: <span>{player.attack.toString()}</span></p>
                <p className="player-defense">Def: <span>{player.defense.toString()}</span></p>
                <p className="player-potential">Pot: <span>{player.potential.toString()}</span></p>
            </div>
        </div>
    );
};

export default PlayerCard;
