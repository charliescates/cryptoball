import { useMemo, useState } from "react";

import type { Player } from "../../player";
import { FORMATIONS, type Formation } from "./formations";

const EMPTY_FORMATION: (Player | null)[] = Array(5).fill(null);

export const useFormationBuilder = () => {
  const [formation, setFormation] = useState<(Player | null)[]>(EMPTY_FORMATION);
  const [selectedFormation, setSelectedFormation] = useState<Formation>(FORMATIONS[0]);

  const selectedPlayerIds = useMemo(
    () => new Set(formation.filter((player): player is Player => player !== null).map((player) => player.id)),
    [formation],
  );

  const selectedCount = selectedPlayerIds.size;
  const isFormationComplete = formation.every((player) => player !== null);
  const isFormationEmpty = formation.every((player) => player === null);

  const handlePlayerClick = (player: Player) => {
    const isAlreadySelected = formation.some((item) => item?.id === player.id);

    if (isAlreadySelected) {
      setFormation((previous) => previous.map((item) => (item?.id === player.id ? null : item)));
      return;
    }

    const firstEmptyIndex = formation.findIndex((item) => item === null);

    if (firstEmptyIndex !== -1) {
      setFormation((previous) => {
        const next = [...previous];
        next[firstEmptyIndex] = player;
        return next;
      });
    }
  };

  const handlePositionClick = (index: number) => {
    setFormation((previous) => {
      const next = [...previous];
      next[index] = null;
      return next;
    });
  };

  const clearFormation = () => setFormation(EMPTY_FORMATION);

  const handleFormationChange = (formationName: string) => {
    const nextFormation = FORMATIONS.find((item) => item.name === formationName);

    if (nextFormation) {
      setSelectedFormation(nextFormation);
      setFormation(EMPTY_FORMATION);
    }
  };

  const attackingPlayers = formation
    .slice(0, selectedFormation.attack)
    .filter((player): player is Player => player !== null);
  const midfieldPlayers = formation
    .slice(selectedFormation.attack, selectedFormation.attack + selectedFormation.midfield)
    .filter((player): player is Player => player !== null);
  const defensivePlayers = formation
    .slice(selectedFormation.attack + selectedFormation.midfield, 5)
    .filter((player): player is Player => player !== null);

  return {
    attackingPlayers,
    clearFormation,
    defensivePlayers,
    formation,
    handleFormationChange,
    handlePlayerClick,
    handlePositionClick,
    isFormationComplete,
    isFormationEmpty,
    midfieldPlayers,
    selectedCount,
    selectedFormation,
    selectedPlayerIds,
  };
};
