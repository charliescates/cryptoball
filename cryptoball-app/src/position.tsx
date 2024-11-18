import { useDrop } from 'react-dnd';
import { Player } from './player';
import { getPlayerName } from './playerName';

type PositionProps = {
    positionName: string;
    teamColour: string;
    index: number;
    player: Player | null;
    onPlayerDrop: (positionIndex: number, player: Player) => void;
    };

const Position = ({ positionName, teamColour, index, player, onPlayerDrop }: PositionProps) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'PLAYER',
    drop: (item: Player) => onPlayerDrop(index, item),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  return (
    <div
      ref={drop}
      className="position"
      style={{
        backgroundColor: isOver
          ? canDrop
            ? '#dff0d8'
            : '#f2dede'
          : '#444',
        border: '2px solid #999',
        borderRadius: '8px',
        padding: '10px',
        margin: '5px',
        minHeight: '50px',
        textAlign: 'center',
        color: teamColour,
      }}
    >
      {player ? (
        <>
          <strong>{getPlayerName(player.id)}</strong>
          <br />
          Att: {player.attack.toString()} Def: {player.defense.toString()} Pot: {player.potential.toString()}
        </>
      ) : (
        <span>{positionName}</span>
      )}
    </div>
  );
};

export default Position;