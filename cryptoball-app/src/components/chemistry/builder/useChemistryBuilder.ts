import { useMemo, useState } from "react";

import type { PlayerType } from "../../utils/playerType";
import { builderFormations } from "../data";
import {
  calculatePreviewStats,
  createFormationSlots,
  createInitialSlotsByFormation,
  getNearMissTips,
} from "./builderUtils";

const DEFAULT_FORMATION = builderFormations[4];

export const useChemistryBuilder = () => {
  const [selectedFormationName, setSelectedFormationName] = useState(DEFAULT_FORMATION.name);
  const [slotsByFormation, setSlotsByFormation] = useState(() => createInitialSlotsByFormation(builderFormations));
  const selectedFormation =
    builderFormations.find((formation) => formation.name === selectedFormationName) ?? DEFAULT_FORMATION;
  const slots = slotsByFormation[selectedFormation.name] ?? createFormationSlots(selectedFormation);
  const teamStats = useMemo(() => calculatePreviewStats(slots), [slots]);
  const nearMisses = useMemo(() => getNearMissTips(slots), [slots]);

  const updateSlot = (slotId: string, playerType: PlayerType) => {
    setSlotsByFormation((previous) => ({
      ...previous,
      [selectedFormation.name]: slots.map((slot) => (slot.id === slotId ? { ...slot, playerType } : slot)),
    }));
  };

  return {
    nearMisses,
    selectedFormationName,
    setSelectedFormationName,
    slots,
    teamStats,
    updateSlot,
  };
};
