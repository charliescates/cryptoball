import type { Player } from "../player";
import Position from "../position";

interface FormationRowProps {
  activePositionIndex?: number | null;
  count: number;
  formation: (Player | null)[];
  icon: string;
  label: string;
  onPositionClick: (index: number) => void;
  startIndex: number;
  teamAddress?: string;
  teamColour: string;
}

const FormationRow = ({
  activePositionIndex = null,
  count,
  formation,
  icon,
  label,
  onPositionClick,
  startIndex,
  teamAddress,
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
              teamAddress={teamAddress}
              index={index}
              player={formation[index]}
              isActive={activePositionIndex === index}
              onPositionClick={onPositionClick}
            />
          );
        })}
      </div>
    </div>
  );
};

export default FormationRow;
