import { type PlayerType, getPlayerTypeColor } from "../../utils/playerType";
import { roleCards } from "../data";
import { getRoleQuality, getSlotsByRole } from "./builderUtils";
import { type BuilderSlot, type SlotRole, roleLabels, slotRoles } from "./types";

interface FormationPitchProps {
  onSlotChange: (slotId: string, playerType: PlayerType) => void;
  slots: BuilderSlot[];
}

const FormationPitch = ({ onSlotChange, slots }: FormationPitchProps) => (
  <div className="chemistry-pitch" aria-label="Formation slots">
    {slotRoles.map((role) => (
      <FormationLine key={role} onSlotChange={onSlotChange} role={role} slots={getSlotsByRole(slots, role)} />
    ))}
  </div>
);

interface FormationLineProps extends FormationPitchProps {
  role: SlotRole;
}

const FormationLine = ({ onSlotChange, role, slots }: FormationLineProps) => {
  if (slots.length === 0) return null;

  return (
    <div className="chemistry-line">
      <div className="chemistry-line-label">{roleLabels[role]}</div>
      <div className="chemistry-line-slots" style={{ gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}>
        {slots.map((slot) => (
          <FormationSlot key={slot.id} onSlotChange={onSlotChange} slot={slot} />
        ))}
      </div>
    </div>
  );
};

interface FormationSlotProps {
  onSlotChange: (slotId: string, playerType: PlayerType) => void;
  slot: BuilderSlot;
}

const FormationSlot = ({ onSlotChange, slot }: FormationSlotProps) => {
  const color = getPlayerTypeColor(slot.playerType);

  return (
    <div className="chemistry-slot" style={{ borderColor: color }}>
      <div className="chemistry-slot-heading">
        <span>{slot.label}</span>
        <strong style={{ color }}>{getRoleQuality(slot)}</strong>
      </div>
      <select
        aria-label={`${slot.label} player type`}
        value={slot.playerType}
        onChange={(event) => onSlotChange(slot.id, Number(event.target.value) as PlayerType)}
      >
        {roleCards.map((roleCard) => (
          <option key={roleCard.title} value={roleCard.id}>
            {roleCard.title}
          </option>
        ))}
      </select>
    </div>
  );
};

export default FormationPitch;
