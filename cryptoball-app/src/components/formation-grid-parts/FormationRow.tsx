import type { Player } from "../player";
import Position from "../position";

interface FormationRowProps {
  count: number;
  formation: (Player | null)[];
  icon: string;
  label: string;
  onPositionClick: (index: number) => void;
  startIndex: number;
  teamColour: string;
}

const FormationRow = ({
  count,
  formation,
  icon,
  label,
  onPositionClick,
  startIndex,
  teamColour,
}: FormationRowProps) => {
  if (count === 0) {
    return null;
  }

  return (
    <div className="formation-row">
      <div className="position-label">
        {icon} {label}
      </div>
      <div className="formation-positions" style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
        {Array.from({ length: count }).map((_, offset) => {
          const index = startIndex + offset;

          return (
            <Position
              key={index}
              positionName={label}
              teamColour={teamColour}
              index={index}
              player={formation[index]}
              onPositionClick={onPositionClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default FormationRow;
